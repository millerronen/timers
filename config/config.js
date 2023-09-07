module.exports = {
  // Server settings
  server: {
    port: process.env.PORT || 3000, // Port for the HTTP server
  },

  // Database settings
  database: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "ronenmiller@localhost",
    password: process.env.DB_PASSWORD || "Miller2608!",
    databaseName: process.env.DB_NAME || "timersdb",
  },
};
