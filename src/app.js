require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const timerRoutes = require("./routes/timerRoutes");

const app = express();
const port = process.env.PORT || 3000;

// Create a write stream to log requests to a file
const logStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
  flags: "a", // Append to the file
});

const customFormat = "[:date[clf]] :method :url :status :response-time ms"; // Define a custom format for the logger
app.use(morgan(customFormat, { stream: logStream }));

app.use(bodyParser.json());
app.use("/api", timerRoutes); // Define a base path for my routes

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
