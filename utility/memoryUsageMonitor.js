const fs = require("fs");
const path = require("path");

const MEMORY_CHECK_INTERVAL_MS = 1 * 1000; // 1 second
const MEMORY_LIMIT_MB = 200; // Set your memory limit in megabytes

// Specify the path to the log file
const logFilePath = path.join(__dirname, "../utility/memory_usage.log");

// Create a write stream to the log file
const logStream = fs.createWriteStream(logFilePath, {
  flags: "a", // Append to the file
});

function checkMemoryUsage() {
  const memoryUsage = process.memoryUsage();

  const memoryInMB = memoryUsage.heapUsed / 1024 / 1024;

  const memoryInfo = `\n
                        Memory Usage:\n
                        -------------------------------------------------\n
                        Heap Total: ${memoryUsage.heapTotal} bytes\n
                        Heap Used: ${memoryUsage.heapUsed} bytes\n
                        External: ${memoryUsage.external} bytes\n
                        Array Buffers: ${memoryUsage.arrayBuffers} bytes\n
                        Memory Used: ${memoryInMB.toFixed(2)} MB\n
                        -------------------------------------------------\n`;

  // Write the memory information to the log file using the stream
  logStream.write(memoryInfo, (err) => {
    if (err) {
      console.error(`Error writing to file: ${err}`);
    }
  });

  if (memoryInMB > MEMORY_LIMIT_MB) {
    console.error("Memory usage exceeds the limit. Taking action...");
    // TODO: Implement some action here, such as restarting the application or sending an alert.
  }
}

// Check memory usage every X seconds (adjust the interval as needed)
setInterval(checkMemoryUsage, MEMORY_CHECK_INTERVAL_MS);
