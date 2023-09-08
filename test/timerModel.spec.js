// const assert = require("chai").assert; // Import Chai's assert function
// const Timer = require("../src/models/timerModel"); // Replace with the actual path to your Timer model

// describe("Timer", () => {
//   // Test case for creating a Timer instance
//   it("should create a Timer instance with the provided values", () => {
//     const timer = new Timer(1, 1, 30, 0, "http://example.com");
//     assert.strictEqual(timer.id, 1);
//     assert.strictEqual(timer.hours, 1);
//     assert.strictEqual(timer.minutes, 30);
//     assert.strictEqual(timer.seconds, 0);
//     assert.strictEqual(timer.url, "http://example.com");
//     assert.ok(timer.startTime); // Assert that startTime is truthy
//   });

//   // Test case for calculating time left
//   it("should calculate the time left in seconds", () => {
//     const timer = new Timer(1, 1, 30, 0, "http://example.com");

//     // Simulate a start time (e.g., 1 minute ago)
//     const currentTime = Date.now();
//     const oneMinuteAgo = currentTime - 60 * 1000;
//     timer.startTime = oneMinuteAgo;

//     // Calculate the expected time left (in seconds)
//     const expectedTimeLeft = 1 * 3600 + 29 * 60;

//     // Check if the calculated time left is approximately equal to the expected time left
//     assert.approximately(
//       timer.calculateTimeLeftInSeconds(),
//       expectedTimeLeft,
//       1 // 1-second tolerance for small timing differences
//     );
//   });

//   // Test case for checking if the timer has expired
//   it("should correctly check if the timer has expired", () => {
//     const timer = new Timer(1, 0, 1, 0, "http://example.com");

//     // Simulate a start time (e.g., 1 minute ago)
//     const currentTime = Date.now();
//     const oneMinuteAgo = currentTime - 60 * 1000;
//     timer.startTime = oneMinuteAgo;

//     // Expect the timer to have expired
//     assert.strictEqual(timer.hasExpired(), true);
//   });

//   //   // Test case for checking if the timer is still active
//   it("should correctly check if the timer is still active", () => {
//     const timer = new Timer(1, 1, 0, 0, "http://example.com");

//     // Simulate a start time (e.g., 1 minute ago)
//     const currentTime = Date.now();
//     const oneMinuteAgo = currentTime - 60 * 1000;
//     timer.startTime = oneMinuteAgo;

//     // Expect the timer to be active
//     assert.strictEqual(timer.isStillActive(), true);
//   });
// });
