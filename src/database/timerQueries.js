const pool = require("../database/db");
const logger = require("../../utility/logger");

const MAX_PENDING_TIMERS = 100;
const RETENTION_DAYS = 30;

async function createTimerRecord(timer) {
    const query = `
    INSERT INTO timers (hours, minutes, seconds, url, start_time, trigger_time, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `;

    const values = [
        timer.hours,
        timer.minutes,
        timer.seconds,
        timer.url,
        timer.creationTime,
        timer.triggerTime,
    ];

    try {
        const [results] = await pool.query(query, values);
        return results.insertId;
    } catch (error) {
        // Handle the error, but don't send the response here
        logger.error(`Error creating timer: ${error}`);
        throw new Error("Error creating timer");
    }
}

async function getTimerDetailsById(timerId) {
    const query = `
    SELECT hours, minutes, seconds, start_time
    FROM timers
    WHERE id = ?
  `;

    try {
        const [results] = await pool.query(query, [timerId]);
        return results[0];
    } catch (error) {
        // Handle the error, but don't send the response here
        logger.error(`Error getting timer details: ${error}`);
        throw new Error("Error getting timer details");
    }
}

async function fetchTimersToEnqueue(endTime) {
    try {
        const query = `
      SELECT *
      FROM timers
      WHERE status = 'pending' AND trigger_time <= ? AND trigger_time >= NOW()
      LIMIT ?
    `;

        const [result] = await pool.query(query, [endTime, MAX_PENDING_TIMERS]);
        return result;
    } catch (error) {
        logger.error("Error fetch timers to Enqueue:", error);
        throw new Error("Error fetching timers to Enqueue");
    }
}

async function updateTimerStatus(timerId, status) {
    try {
        await pool.query("UPDATE timers SET status = ? WHERE id = ?", [
            status,
            timerId,
        ]);
    } catch (error) {
        logger.error("Error updating timer status:", error);
        throw new Error("Error updating timer status");
    }
}

async function getExpiredTimers() {
    try {
        const query = `
      SELECT *
      FROM timers
      WHERE status = 'pending' AND trigger_time <= UTC_TIMESTAMP()
    `;

        const [result] = await pool.query(query);
        return result;
    } catch (error) {
        logger.error("Error fetching expired timers:", error);
        throw new Error("Error fetching expired timers");
    }
}

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
        throw new Error("Error cleaning up completed or failed timers");
    }
}

module.exports = {
    createTimerRecord,
    getTimerDetailsById,
    fetchTimersToEnqueue,
    updateTimerStatus,
    getExpiredTimers,
    cleanupCompletedOrFailedTimers,
};
