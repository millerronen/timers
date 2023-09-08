// routes/timerRoutes.js
const express = require("express");
const router = express.Router();
const timerController = require("../controllers/timerController");

// Set Timer endpoint
router.post("/timers", timerController.createTimer);

// Get Timer Status endpoint
router.get("/timers/:id", timerController.getTimerStatus);

module.exports = router;
