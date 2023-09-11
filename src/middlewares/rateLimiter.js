// middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 1000, // Max 1000 requests per windowMs
  message: "Too many requests, please try again later.",
});

module.exports = limiter;
