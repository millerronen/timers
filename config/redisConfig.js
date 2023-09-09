// redisConfig.js
const redis = require("ioredis");
const { promisify } = require("util");

// Create a Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || "",
});

// Promisify Redis functions to use async/await
const redisSet = promisify(redisClient.set).bind(redisClient);
const redisDel = promisify(redisClient.del).bind(redisClient);

module.exports = { redisClient, redisSet, redisDel };
