const axios = require("axios");
const pool = require("../database/db");
const { redisClient, redisSet, redisDel } = require("../../config/redisConfig");

// Your code here that uses the Redis client and functions

// Constants
const TIMER_CHECK_INTERVAL = 60 * 1000; // 1 minute
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const RETENTION_DAYS = 30;
const MAX_ALLOWED_TIME_IN_SECONDS = 30 * 24 * 3600;
const BATCH_INTERVAL = 1000; // 1 seconds
const lockExpirationInSeconds = 60; // Define the lock expiration time in seconds, change as needed

// Function to create and schedule a timer
async function createTimer(req, res) {
  const { hours, minutes, seconds, url } = req.body;

  // Validate the input
  if (!validateInput(hours, minutes, seconds, url)) {
    return res.status(400).json({ error: "Invalid input data" });
  }

  // Calculate the total time in seconds
  const totalTimeInSeconds = hours * 3600 + minutes * 60 + seconds;

  // Calculate the total time in milliseconds
  const totalTimeInMilliseconds =
    hours * 3600000 + minutes * 60000 + seconds * 1000;

  // Get the current time when the timer is created
  const creationTime = new Date();

  // Calculate the trigger time
  const triggerTime = new Date(
    creationTime.getTime() + totalTimeInMilliseconds
  );

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Insert timer data into the database with status "pending"
    const [results] = await connection.query(
      "INSERT INTO timers (hours, minutes, seconds, url, start_time, trigger_time, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
      [hours, minutes, seconds, url, creationTime, triggerTime]
    );

    const timerId = results.insertId;

    // Commit the transaction
    await connection.commit();

    // Respond with the timer ID and time left
    res.json({
      id: timerId,
      time_left: totalTimeInSeconds,
    });
  } catch (error) {
    await connection.rollback(); // Rollback the transaction on error
    console.error("Error creating timer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
}

// Function to get timer status by ID
async function getTimerStatus(req, res) {
  const timerId = req.params.id;

  // Validate timerId to ensure it's a valid integer
  if (!Number.isInteger(Number(timerId))) {
    return res.status(400).json({ error: "Invalid timer ID" });
  }

  try {
    // Query the database to get the timer details
    const [results] = await pool.query(
      "SELECT hours, minutes, seconds, start_time FROM timers WHERE id = ?",
      [timerId]
    );

    if (results.length === 0) {
      // Timer not found
      res.status(404).json({ error: "Timer not found" });
      return;
    }

    const timerData = results[0];
    const currentTime = new Date();
    const startTime = new Date(timerData.start_time);
    const elapsedTimeInSeconds = Math.floor((currentTime - startTime) / 1000);

    const timeLeftInSeconds =
      timerData.hours * 3600 +
      timerData.minutes * 60 +
      timerData.seconds -
      elapsedTimeInSeconds;

    if (timeLeftInSeconds <= 0) {
      // Timer has expired
      res.json({ id: timerId, time_left: 0 });
    } else {
      // Timer is still active
      res.json({ id: timerId, time_left: timeLeftInSeconds });
    }
  } catch (error) {
    console.error("Error getting timer status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Function to periodically schedule timers in batches
async function scheduleTimersInBatches() {
  try {
    // Calculate the time window for timers to be scheduled (e.g., next 10 seconds)
    const currentTime = new Date();
    const endTime = new Date(currentTime.getTime() + BATCH_INTERVAL);

    // Retrieve timers with status "pending" and trigger time within the time window
    const [result] = await pool.query(
      "SELECT * FROM timers WHERE status = 'pending' AND trigger_time <= ? AND trigger_time >= NOW()",
      [endTime]
    );

    if (Array.isArray(result) && result.length > 0) {
      for (const timer of result) {
        const { id: timerId, url, trigger_time, status } = timer;

        // Check if the timer is already being processed or completed
        if (status === "completed") {
          continue; // Skip this timer
        }

        // Execute the timer with distributed locking
        await executeTimerWithLock(timerId, url);
      }
    }
  } catch (error) {
    console.error("Error scheduling timers:", error);
  }
}

// Create a validation function
function validateInput(hours, minutes, seconds, url) {
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    typeof url !== "string" ||
    !url.startsWith("http") ||
    hours * 3600 + minutes * 60 + seconds > MAX_ALLOWED_TIME_IN_SECONDS // check if the total time exceeds 30 days - see README.md
  ) {
    return false;
  }
  return true;
}

// Function to update the status of a timer in the database
async function updateTimerStatus(timerId, status) {
  try {
    await pool.query("UPDATE timers SET status = ? WHERE id = ?", [
      status,
      timerId,
    ]);
  } catch (error) {
    console.error("Error updating timer status:", error);
  }
}

// Function to check and trigger expired timers when the application starts
async function checkAndTriggerExpiredTimers() {
  try {
    // Retrieve timers with status "pending" and trigger time in the past
    const [result] = await pool.query(
      "SELECT * FROM timers WHERE status = 'pending' AND trigger_time <= NOW()"
    );

    if (Array.isArray(result) && result.length > 0) {
      for (const timer of result) {
        const { id: timerId, url } = timer;

        // Trigger the webhook by making a POST request to the URL with the timer ID appended
        await axios.post(`${url}/${timerId}`);

        // Mark the timer as "completed" in the database
        await updateTimerStatus(timerId, "completed");
      }
    }
  } catch (error) {
    console.error("Error checking and triggering expired timers:", error);
  }
}

// Function to periodically delete completed timers older than a certain threshold
async function cleanupCompletedTimers() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    await pool.query(
      "DELETE FROM timers WHERE status = 'completed' AND start_time <= ?",
      [cutoffDate]
    );
  } catch (error) {
    console.error("Error cleaning up completed timers:", error);
  }
}

// Function to execute a timer with distributed locking
async function executeTimerWithLock(timerId, url) {
  try {
    // Attempt to acquire a lock for the timer using Redis
    const lockKey = `timer_lock:${timerId}`;
    const lockValue = generateLockValue(); // Generate a unique lock value

    const lockAcquired = await redisSet(
      lockKey,
      lockValue,
      "NX",
      "EX",
      lockExpirationInSeconds
    );

    if (lockAcquired === "OK") {
      // The lock was acquired, so we can proceed to execute the timer

      // Get the current time when the timer is executed
      const executionTime = new Date();

      // Trigger the webhook by making a POST request to the URL with the timer ID appended
      await axios.post(`${url}/${timerId}`);

      // Log the execution time
      console.log(`Timer ID ${timerId} executed at ${executionTime}`);

      // Mark the timer as "completed" in the database
      await updateTimerStatus(timerId, "completed");

      // Release the lock
      await releaseLock(timerId);
    } else {
      // The lock could not be acquired, indicating that another instance is already processing this timer
      console.log(
        `Timer ID ${timerId} is already being processed by another instance.`
      );
    }
  } catch (error) {
    console.error(`Error executing timer ID ${timerId}:`, error);
  }
}

async function releaseLock(timerId) {
  try {
    // Release the lock by deleting the lock key in Redis
    const lockKey = `timer_lock:${timerId}`;
    await redisDel(lockKey);
  } catch (error) {
    console.error(`Error releasing lock for timer ID ${timerId}:`, error);
  }
}

// Generate a unique lock value (you can use a UUID library or another method)
function generateLockValue() {
  return Math.random().toString(36).substring(2); // Example: Generates a random string
}

module.exports = { createTimer, getTimerStatus };

// Schedule recurring tasks
setInterval(scheduleTimersInBatches, BATCH_INTERVAL);
setInterval(checkAndTriggerExpiredTimers, TIMER_CHECK_INTERVAL);
setInterval(cleanupCompletedTimers, CLEANUP_INTERVAL);
