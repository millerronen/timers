const axios = require("axios");
const pool = require("../database/db");
const logger = require("../../utility/logger");
const { redisClient } = require("../../config/redisConfig");
const Timer = require("../models/timerModel");
const { createTimerRecord, getTimerDetailsById, fetchTimersToEnqueue } = require("../database/timerQueries");

// Constants
const TIMER_CHECK_INTERVAL = 60 * 1000; // 1 minute
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const RETENTION_DAYS = 30;
const BATCH_INTERVAL = 1000; // 1 seconds
const PROCESSING_INTERVAL = 1000; // 1 second

// Function to create and schedule a timer
async function createTimer(req, res) {
  const { hours, minutes, seconds, url } = req.body;

  // Create an instance of Timer
  const timer = new Timer(null, hours, minutes, seconds, url);

  // Validate the input
  if (!timer.validateInput() || !timer.isValidURL()) {
    return res.status(400).json({ error: "Invalid input data" });
  }

  try {
    const timerId = await createTimerRecord(timer);
    const timeLeftInSeconds = timer.calculateTimeLeftInSeconds();

    res.json({
      id: timerId,
      time_left: timeLeftInSeconds,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
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
    const timerData = await getTimerDetailsById(timerId);

    if (!timerData) {
      res.status(404).json({ error: "Timer not found" });
      return;
    }

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
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function scheduleTimersInBatches() {
  try {
    const endTime = new Date(Date.now() + BATCH_INTERVAL).toISOString();
    const result = await fetchTimersToEnqueue(endTime);

    if (Array.isArray(result) && result.length > 0) {
      // Create an array of promises to enqueue each timer
      const enqueuePromises = result.map((timer) => {
        updateTimerStatus(timer.id, "processing");
        enqueueTimersInRedis(timer);
      });

      // Use Promise.all to enqueue all timers concurrently
      await Promise.all(enqueuePromises);
    }
  } catch (error) {
    logger.error("Error scheduling timers:", error);
  }
}

async function enqueueTimersInRedis(timer) {
  const redisKey = "pending_timers";
  const { id: timerId, url, trigger_time, status } = timer;
  const timerData = {
    id: timerId,
    url,
  };

  // Calculate the score (trigger time) for the timer
  const triggerTime = new Date(trigger_time).getTime();

  // Enqueue the timer in Redis Sorted Set
  await redisClient.zadd(redisKey, triggerTime, JSON.stringify(timerData));
}

// Function to update the status of a timer in the database
async function updateTimerStatus(timerId, status) {
  try {
    await pool.query("UPDATE timers SET status = ? WHERE id = ?", [
      status,
      timerId,
    ]);
  } catch (error) {
    logger.error("Error updating timer status:", error);
  }
}

// Function to check and trigger expired timers when the application starts
async function checkAndTriggerExpiredTimers() {
  try {
    // Retrieve timers with status "pending" and trigger time in the past
    const [result] = await pool.query(
      "SELECT * FROM timers WHERE status = 'pending' AND trigger_time <= UTC_TIMESTAMP()"
    );

    if (Array.isArray(result) && result.length > 0) {
      // Create an array of promises to enqueue each timer
      const enqueuePromises = result.map((timer) => {
        enqueueTimersInRedis(timer);
        updateTimerStatus(timer.id, "processing");
      });

      // Use Promise.all to enqueue all timers concurrently
      await Promise.all(enqueuePromises);
    }
  } catch (error) {
    logger.error("Error checking and triggering expired timers:", error);
  }
}

// Function to process timers from Redis Sorted Set
async function processTimers() {
  try {
    // Check if there are timers in the Redis Sorted Set
    const isPendingTimersEmpty =
      (await redisClient.zcard("pending_timers")) === 0;

    if (!isPendingTimersEmpty) {
      // Get the current time in milliseconds
      const currentTime = Date.now();

      // Retrieve timers with scores (trigger times) less than or equal to the current time
      const timers = await redisClient.zrangebyscore(
        "pending_timers",
        "-inf",
        currentTime
      );

      // Process timers concurrently using Promise.all
      await Promise.all(
        timers.map(async (timer) => {
          const timerData = JSON.parse(timer);
          const { id: timerId, url } = timerData;

          try {
            // Process the timer
            await axios.post(`${url}/${timerId}`);

            // Mark the timer as "completed" in the database
            await updateTimerStatus(timerId, "completed");

            // Remove the timer from Redis Sorted Set
            await redisClient.zrem("pending_timers", timer);

            // Get the current time when the timer is executed
            const executionTime = new Date();

            // Log the execution time
            logger.info(
              `Timer ID ${timerId} executed at ${executionTime.toISOString()}`
            );
          } catch (error) {
            // Handle the external request error
            logger.error(`Error processing timer ${timerId}: ${error}`);
            await updateTimerStatus(timerId, "failed"); // Mark the timer as "failed" in the database
            await redisClient.zrem("pending_timers", timer); // Remove the timer from Redis Sorted Set
          }
        })
      );
    }
  } catch (error) {
    logger.error(`Error processing timers: ${error}`);
  }
}

// Function to periodically delete completed or failed timers that are older than a certain threshold
async function cleanupCompletedOrFailedTimers() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - RETENTION_DAYS);

    await pool.query(
      "DELETE FROM timers WHERE (status = 'completed' OR status = 'failed') AND start_time <= ?",
      [cutoffDate.toFormat("yyyy-MM-dd HH:mm:ss")]
    );
  } catch (error) {
    logger.error(`Error cleaning up completed or failed timers: ${error}`);
  }
}

module.exports = { createTimer, getTimerStatus };

// Schedule recurring tasks
setInterval(scheduleTimersInBatches, BATCH_INTERVAL);
setInterval(checkAndTriggerExpiredTimers, TIMER_CHECK_INTERVAL);
setInterval(cleanupCompletedOrFailedTimers, CLEANUP_INTERVAL);
setInterval(processTimers, PROCESSING_INTERVAL);
