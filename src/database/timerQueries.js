const pool = require("../database/db");
const logger = require("../../utility/logger");

const MAX_PENDING_TIMERS = 100;

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
    const query = `
      SELECT *
      FROM timers
      WHERE status = 'pending' AND trigger_time <= ? AND trigger_time >= NOW()
      LIMIT ?
    `;

    const [result] = await pool.query(query, [endTime, MAX_PENDING_TIMERS]);
    return result;
}

module.exports = {
    createTimerRecord,
    getTimerDetailsById,
    fetchTimersToEnqueue,
};
