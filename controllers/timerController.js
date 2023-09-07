const axios = require("axios");
const pool = require("../db");
const schedule = require("node-schedule");

// Function to create and schedule a timer
async function createTimer(req, res) {
  const { hours, minutes, seconds, url } = req.body;

  try {
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

    // Insert timer data into the database with status "pending"
    const [results] = await pool.query(
      "INSERT INTO timers (hours, minutes, seconds, url, start_time, trigger_time, status) VALUES (?, ?, ?, ?, NOW(), ?, 'pending')",
      [hours, minutes, seconds, url, triggerTime]
    );

    const timerId = results.insertId;

    // Schedule the timer to execute after the specified time
    scheduleTimer(timerId, totalTimeInMilliseconds, url);

    // Respond with the timer ID and time left
    res.json({
      id: timerId,
      created_at: creationTime,
      time_left: totalTimeInSeconds,
    });
  } catch (error) {
    console.error("Error creating timer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Function to schedule and execute a timer
function scheduleTimer(timerId, totalTimeInMilliseconds, url) {
  // Schedule the timer to execute after the specified time
  setTimeout(async () => {
    try {
      // Get the current time when the webhook is fired
      const firingTime = new Date();

      // Trigger the webhook by making a POST request to the URL with the timer ID appended
      await axios.post(`${url}/${timerId}`);

      // Log the firing time
      console.log(`Webhook fired for timer ID ${timerId} at ${firingTime}`);

      // Remove the timer from the database after the webhook has been sent successfully
      await removeTimerFromDatabase(timerId);
    } catch (error) {
      console.error("Error triggering webhook:", error);
    }
  }, totalTimeInMilliseconds);
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
    const [results] = await pool.query(
      "SELECT * FROM timers WHERE status = 'pending' AND trigger_time <= NOW()"
    );

    for (const timer of results) {
      const { id, url } = timer;

      // Trigger the webhook by making a POST request to the URL with the timer ID appended
      await axios.post(`${url}/${id}`);

      // Mark the timer as "completed" in the database
      await markTimerAsCompleted(id);
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
    const retentionDays = 30; // Adjust as needed
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    await pool.query(
      "DELETE FROM timers WHERE status = 'completed' AND start_time <= ?",
      [cutoffDate]
    );
  } catch (error) {
    console.error("Error cleaning up completed timers:", error);
  }
}

// Schedule a recurring task to check and trigger expired timers
const timerCheckInterval = setInterval(checkAndTriggerExpiredTimers, 60000); // Run every minute

// Schedule a recurring task to clean up completed timers
const cleanupInterval = setInterval(cleanupCompletedTimers, 3600000); // Run hourly

module.exports = { createTimer, getTimerStatus };
