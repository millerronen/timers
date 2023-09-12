const mysql = require("mysql2/promise");
const config = require("../../config/config");
const logger = require("../../utility/logger");

const MAX_CONNECTION_RETRIES = 5; // Maximum number of connection retries
const RETRY_INTERVAL_MS = 5000; // Retry interval in milliseconds (5 seconds)

async function createConnectionWithRetry() {
  let connection;
  let retries = 0;

  while (retries < MAX_CONNECTION_RETRIES) {
    try {
      connection = await mysql.createConnection({
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        password: config.database.password,
      });

      // If the connection is successful, break out of the loop
      break;
    } catch (error) {
      logger.error(`Error creating database connection: ${error}`);
      retries++;

      if (retries < MAX_CONNECTION_RETRIES) {
        logger.info(
          `Retrying database connection in ${
            RETRY_INTERVAL_MS / 1000
          } seconds...`
        );

        // Wait for the retry interval before attempting to connect again
        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      } else {
        // If maximum retries reached, exit the application
        logger.error("Maximum connection retries reached. Exiting...");
        process.exit(1);
      }
    }
  }

  return connection;
}

async function createDatabaseAndTableIfNotExists() {
  try {
    const connection = await createConnectionWithRetry();

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${config.database.databaseName}`
    );

    logger.info("Database has been created or already exists.");

    // Call the function to create the timers table
    await createTimersTableIfNotExists(connection);

    connection.end();
  } catch (error) {
    logger.error(`Error creating database:, ${error}`);
    process.exit(1);
  }
}

async function createTimersTableIfNotExists(connection) {
  try {
    // Select the database
    await connection.query(`USE ${config.database.databaseName}`);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS timers (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        hours INT,
        minutes INT,
        seconds INT,
        url VARCHAR(255),
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        trigger_time TIMESTAMP,
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        INDEX idx_status_trigger_time (status, trigger_time)
      )
    `);

    logger.info("Timers table has been created or already exists.");
  } catch (error) {
    logger.error(`Error creating timers table: ${error}`);
    process.exit(1);
  }
}

createDatabaseAndTableIfNotExists();

// Create a connection pool
const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.databaseName,
  connectionLimit: config.database.connectionLimit,
  queueLimit: config.database.queueLimit,
});

module.exports = pool;
