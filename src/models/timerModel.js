// models/timerModel.js
class Timer {
  constructor(id, hours, minutes, seconds, url) {
    this.id = id;
    this.hours = hours;
    this.minutes = minutes;
    this.seconds = seconds;
    this.url = url;
    this.startTime = Date.now(); // Store the start time

    // Calculate the trigger time based on the start time and timer duration
    this.triggerTime =
      this.startTime + (hours * 3600 + minutes * 60 + seconds) * 1000;
  }

  // Calculate the time left in seconds
  calculateTimeLeftInSeconds() {
    const currentTime = Date.now();
    const elapsedTimeInSeconds = Math.floor(
      (currentTime - this.startTime) / 1000
    );

    const totalSeconds = this.hours * 3600 + this.minutes * 60 + this.seconds;
    const timeLeftInSeconds = totalSeconds - elapsedTimeInSeconds;

    return Math.max(0, timeLeftInSeconds); // Ensure the result is non-negative
  }

  // Check if the timer has expired
  hasExpired() {
    return this.calculateTimeLeftInSeconds() === 0;
  }

  isStillActive() {
    const currentTime = Date.now();
    const timeLeft = this.triggerTime - currentTime;

    // Check if there is time left (timeLeft > 0) to determine if the timer is active
    return timeLeft > 0;
  }
}

module.exports = Timer;
