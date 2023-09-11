const redis = require("ioredis");
const logger = require("../utility/logger");

// Create a Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || "",
});

redisClient.on("error", (error) => {
  logger.error(`Redis connection error: ${error.message}`);
  process.exit(1); // Optionally exit the application with a non-zero status code
});

module.exports = { redisClient };
