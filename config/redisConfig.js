// redisConfig.js
const redis = require("ioredis");

// Create a Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || "",
});

module.exports = { redisClient };
