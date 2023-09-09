const mysql = require("mysql2/promise");
const config = require("../../config/config");

// Function to create the timers table if it doesn't exist
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
    id INT AUTO_INCREMENT PRIMARY KEY,
    hours INT,
    minutes INT,
    seconds INT,
    url VARCHAR(255),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trigger_time TIMESTAMP,
    status ENUM('pending', 'completed') DEFAULT 'pending',
    INDEX idx_status_trigger_time (status, trigger_time)
  )
`);

    console.log("Timers table has been created or already exists.");
  } catch (error) {
    console.error("Error creating timers table:", error);
  }
}

// Call the function to create the table during application startup
createTimersTableIfNotExists();

// Create a connection pool
const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.databaseName,
  waitForConnections: true,
  connectionLimit: 10, // Adjust this based on your needs
  queueLimit: 0,
});

module.exports = pool;
