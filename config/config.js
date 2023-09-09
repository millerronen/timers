const dotenv = require("dotenv");
dotenv.config(); // Load variables from .env file

module.exports = {
  // Server settings
  server: {
    port: process.env.PORT || 3000, // Port for the HTTP server
  },

  // Database settings
  database: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "your_db_user",
    password: process.env.DB_PASSWORD || "your_db_password",
    databaseName: process.env.DB_NAME || "timersdb",
  },

  // Redis settings
  redis: {
    host: process.env.REDIS_HOST || "localhost", // Redis server host
    port: process.env.REDIS_PORT || 6379, // Redis server port
    password: process.env.REDIS_PASSWORD || "", // Redis server password (if set)
  },
};
