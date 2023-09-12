const { getTimerStatus } = require("../src/controllers/timerController");
const { createTimer } = require("../src/controllers/timerController");
require("chai");
const sinon = require("sinon");

describe("getTimerStatus", () => {
  let mockPool;
  let mockConnection;
  let currentTime;
  let startTime;
  let clock;

  beforeEach(() => {
    // Mock the database pool and connection using Sinon
    const db = require("../src/database/db");
    mockPool = sinon.stub(db, "getConnection");
    mockConnection = {
      beginTransaction: sinon.stub(),
      commit: sinon.stub(),
      rollback: sinon.stub(),
      release: sinon.stub(),
      query: sinon.stub(),
    };
    mockPool.resolves(mockConnection);

    // Mock the current time and start time
    currentTime = new Date("2023-09-01T12:00:00Z");
    startTime = new Date("2023-08-31T12:00:00Z");
    // sinon.useFakeTimers(currentTime);
    clock = sinon.useFakeTimers({
      now: currentTime, // Set the initial time
      shouldAdvanceTime: true, // Allow advancing time
    });
  });

  afterEach(() => {
    // Restore the original functions after each test
    mockPool.restore();
    sinon.restore();
  });

  //   it("should return the correct time left for an active timer", async () => {
  //     // Arrange
  //     const req = {
  //       params: {
  //         id: 1,
  //       },
  //     };

  //     const mockSelectResult = [
  //       {
  //         hours: 1,
  //         minutes: 0,
  //         seconds: 0,
  //         start_time: startTime.toISOString(),
  //       },
  //     ];

  //     // Mock the database query to return the select result
  //     mockConnection.query.resolves([mockSelectResult]);

  //     const res = {
  //       status: sinon.stub().returnsThis(),
  //       json: sinon.stub(),
  //     };

  //     // Inside your test
  //     console.log(mockSelectResult); // Check the value of mockSelectResult
  //     console.log(mockConnection.query.args); // Check the arguments passed to query
  //     console.log(mockConnection.query.callCount); // Check how many times query is called

  //     // Act
  //     await getTimerStatus(req, res);

  //     // Assert
  //     sinon.assert.calledOnce(res.status);
  //     sinon.assert.calledOnce(res.json);
  //     sinon.assert.calledWithMatch(res.status, 200);
  //     sinon.assert.calledWithMatch(res.json, {
  //       id: 1,
  //       time_left: 86400, // 24 hours
  //     });
  //   });

  //   it("should return 0 time left for an expired timer", async () => {
  //     const req1 = {
  //       body: {
  //         hours: 1,
  //         minutes: 0,
  //         seconds: 0,
  //         url: "http://example.com",
  //       },
  //     };
  //     const res1 = {
  //       json: sinon.stub(),
  //     };

  //     // Mock the INSERT query result
  //     const mockInsertResult = {
  //       insertId: 1, // Replace with the expected ID
  //     };

  //     // Mock the database query to return the insert result
  //     mockConnection.query.resolves([mockInsertResult]);

  //     // Act
  //     await createTimer(req1, res1);

  //     // Arrange
  //     const req = {
  //       params: {
  //         id: 1,
  //       },
  //     };
  //     const res = {
  //       status: sinon.stub().returnsThis(),
  //       json: sinon.stub(),
  //     };

  //     // Mock the SELECT query result for an expired timer
  //     const mockSelectResult = {
  //       hours: 1,
  //       minutes: 0,
  //       seconds: 0,
  //       start_time: startTime.toISOString(),
  //     };

  //     // Mock the database query to return the select result
  //     mockConnection.query.resolves([mockSelectResult]);

  //     // Fast-forward the current time to simulate an expired timer
  //     const oneDayMilliseconds = 24 * 60 * 60 * 1000;
  //     clock.tick(oneDayMilliseconds);

  //     // Act
  //     await getTimerStatus(req, res);

  //     // Assert
  //     sinon.assert.calledOnce(res.json);
  //     sinon.assert.calledWithMatch(res.json, {
  //       id: 1,
  //       time_left: 0,
  //     });
  //   });

  it("should return an error for an invalid timer ID", async () => {
    // Arrange
    const req = {
      params: {
        id: "invalid-id",
      },
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    // Act
    await getTimerStatus(req, res);

    // Assert
    sinon.assert.calledWith(res.status, 400);
    sinon.assert.calledOnce(res.json);
  });

  it("should return an error for a timer not found", async () => {
    // Arrange
    const req = {
      params: {
        id: 1,
      },
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    // Mock the SELECT query result for a non-existent timer
    const mockSelectResult = [];

    // Mock the database query to return an empty result
    mockConnection.query.resolves([mockSelectResult]);

    // Act
    await getTimerStatus(req, res);

    // Assert
    sinon.assert.calledWith(res.status, 404);
    sinon.assert.calledOnce(res.json);
  });
});
