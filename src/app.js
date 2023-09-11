require("dotenv").config();
require("../utility/memoryUsageMonitor");
const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const timerRoutes = require("./routes/timerRoutes");
const rateLimiter = require("./middlewares/rateLimiter");
const log = require("../utility/logger");

const app = express();
const port = process.env.PORT || 3000;

// Create a write stream to log requests to a file
const logStream = fs.createWriteStream(
  path.join(__dirname, "../logs/access.log"),
  {
    flags: "a", // Append to the file
  }
);

const customFormat = "[:date[clf]] :method :url :status :response-time ms"; // Define a custom format for the logger
app.use(morgan(customFormat, { stream: logStream }));

app.use(bodyParser.json());
app.use("/timers", rateLimiter); // Attach rate limiter middleware
app.use("/", timerRoutes); // Define a base path for my routes

// Add a "ping" endpoint
app.get("/ping", (_req, res) => {
  res.send("Hello from timer service");
});

app.listen(port, () => {
  log.info(`Server is running on port ${port}`);
});
