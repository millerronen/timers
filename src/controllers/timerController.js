const axios = require("axios");
const pool = require("../database/db");

// Constants
const TIMER_CHECK_INTERVAL = 60 * 1000; // 1 minute
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const RETENTION_DAYS = 30;
const MAX_ALLOWED_TIME_IN_SECONDS = 30 * 24 * 3600;

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
      "INSERT INTO timers (hours, minutes, seconds, url, start_time, trigger_time, status) VALUES (?, ?, ?, ?, NOW(), ?, 'pending')",
      [hours, minutes, seconds, url, triggerTime]
    );

    const timerId = results.insertId;

    // Schedule the timer to execute after the specified time
    scheduleTimer(timerId, totalTimeInMilliseconds, url);

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

// Function to schedule and execute a timer
function scheduleTimer(timerId, totalTimeInMilliseconds, url) {
  // Schedule the timer to execute after the specified time
  setTimeout(async function fireWebhookAndCleanup() {
    try {
      // Get the current time when the webhook is fired
      const firingTime = new Date();

      // Trigger the webhook by making a POST request to the URL with the timer ID appended
      await axios.post(`${url}`, `${timerId}`);

      // Log the firing time
      console.log(`Webhook fired for timer ID ${timerId} at ${firingTime}`);

      // Remove the timer from the database after the webhook has been sent successfully
      await removeTimerFromDatabase(timerId);
    } catch (error) {
      console.error("Error triggering webhook:", error);
    }
  }, totalTimeInMilliseconds);
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

// Function to remove the timer from the database
async function removeTimerFromDatabase(timerId) {
  try {
    // Implement SQL query to remove the timer based on its ID
    await pool.query("DELETE FROM timers WHERE id = ?", [timerId]);
  } catch (error) {
    console.error("Error removing timer from the database:", error);
  }
}

// Function to get timer status by ID
async function getTimerStatus(req, res) {
  const timerId = req.params.id;

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

// Function to check and trigger expired timers when the application starts
async function checkAndTriggerExpiredTimers() {
  try {
    // Retrieve timers with status "pending" and trigger time in the past
    const [result] = await pool.query(
      "SELECT * FROM timers WHERE status = 'pending' AND trigger_time <= NOW()"
    );

    if (Array.isArray(result) && result.length > 0) {
      for (const timer of result) {
        const { id, url } = timer;

        // Trigger the webhook by making a POST request to the URL with the timer ID appended
        await axios.post(`${url}/${id}`);

        // Mark the timer as "completed" in the database
        await markTimerAsCompleted(id);
      }
    }
  } catch (error) {
    console.error("Error checking and triggering expired timers:", error);
  }
}

// Function to mark a timer as completed
async function markTimerAsCompleted(timerId) {
  try {
    await pool.query("UPDATE timers SET status = 'completed' WHERE id = ?", [
      timerId,
    ]);
  } catch (error) {
    console.error("Error marking timer as completed:", error);
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

module.exports = { createTimer, getTimerStatus };

// Schedule recurring tasks
setInterval(checkAndTriggerExpiredTimers, TIMER_CHECK_INTERVAL);
setInterval(cleanupCompletedTimers, CLEANUP_INTERVAL);
