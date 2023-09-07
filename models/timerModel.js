// models/timerModel.js
class Timer {
  constructor(id, hours, minutes, seconds, url) {
    this.id = id;
    this.hours = hours;
    this.minutes = minutes;
    this.seconds = seconds;
    this.url = url;
    this.startTime = Date.now(); // Store the start time
  }

  // Implement methods to calculate time left, check if expired, etc.
}

module.exports = Timer;
