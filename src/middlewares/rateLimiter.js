// middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Max 20 requests per windowMs
  message: "Too many requests, please try again later.",
});

module.exports = limiter;
