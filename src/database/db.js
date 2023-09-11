const mysql = require("mysql2/promise");
const config = require("../../config/config");

async function createDatabaseIfNotExists() {
  try {
    const connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${config.database.databaseName}`
    );
    console.log("Database has been created or already exists.");
    connection.end();
  } catch (error) {
    console.error("Error creating database:", error);
  }
}

async function createTimersTableIfNotExists() {
  try {
    const connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.databaseName,
    });

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

    console.log("Timers table has been created or already exists.");
  } catch (error) {
    console.error("Error creating timers table:", error);
  }
}

createDatabaseIfNotExists();
createTimersTableIfNotExists();

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
