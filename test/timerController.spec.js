const assert = require("assert");
const axios = require("axios");
const sinon = require("sinon"); // You can use sinon for mocking

// const {
//   createTimer,
//   getTimerStatus,
//   checkAndTriggerExpiredTimers,
//   markTimerAsCompleted,
//   cleanupCompletedTimers,
// } = require("../src/controllers/timerController");

const { createTimer } = require("../src/controllers/timerController");

describe("timerController", () => {
  let checkAndTriggerStub;
  let cleanupCompletedStub;

  // Mocking Axios POST requests
  beforeEach(() => {
    // Create stubs for setInterval
    checkAndTriggerStub = sinon.stub(global, "setInterval");
    // Prevent the functions from running
    checkAndTriggerStub.returns(null);
    // cleanupCompletedStub.returns(null);
    sinon.stub(axios, "post");
  });

  afterEach(() => {
    // Restore the original setInterval functions
    checkAndTriggerStub.restore();
    axios.post.restore();
  });

  describe("createTimer", () => {
    it("should create a timer with valid input data", async () => {
      const req = {
        body: {
          hours: 1,
          minutes: 30,
          seconds: 0,
          url: "http://example.com",
        },
      };
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis(),
      };

      // Mock database insert and timer scheduling
      const pool = {
        query: sinon.stub().resolves([{ insertId: 1 }]),
      };
      sinon.replace(require("../src/database/db"), "query", pool.query);

      // Mock the setTimeout function for timer scheduling
      const setTimeoutStub = sinon.stub(global, "setTimeout");

      await createTimer(req, res);

      assert(res.json.calledWith({ id: 1, time_left: 5400 }));

      // Assert that setTimeout was called with the correct parameters
      assert(setTimeoutStub.calledOnce);
      assert.strictEqual(
        setTimeoutStub.firstCall.args[0].name,
        "fireWebhookAndCleanup"
      );

      // Restore the original setTimeout function
      setTimeoutStub.restore();
    });

    it("should return an error for invalid input data", async () => {
      const req = {
        body: {
          hours: "invalid",
          minutes: 30,
          seconds: 0,
          url: "http://example.com",
        },
      };
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis(),
      };

      await createTimer(req, res);

      assert(res.status.calledWith(400));
      assert(res.json.calledWith({ error: "Invalid input data" }));
    });
  });

  //   // describe("getTimerStatus", () => {
  //   //   it("should return the remaining time for an active timer", async () => {
  //   //     const req = {
  //   //       params: { id: 1 },
  //   //     };
  //   //     const res = {
  //   //       json: sinon.spy(),
  //   //     };

  //   //     // Mock database query to return timer data
  //   //     const pool = {
  //   //       query: sinon.stub().resolves([
  //   //         {
  //   //           hours: 1,
  //   //           minutes: 30,
  //   //           seconds: 0,
  //   //           start_time: new Date(),
  //   //         },
  //   //       ]),
  //   //     };
  //   //     sinon.replace(require("../src/database/db"), "query", pool.query);

  //   //     // Mock the current time
  //   //     const currentTime = new Date();
  //   //     const nowStub = sinon.stub(Date, "now").returns(currentTime.getTime());

  //   //     await getTimerStatus(req, res);

  //   //     assert(res.json.calledWith({ id: 1, time_left: 5400 }));

  //   //     // Restore the original Date.now() function
  //   //     nowStub.restore();
  //   //   });

  //   //   it("should return 0 for an expired timer", async () => {
  //   //     const req = {
  //   //       params: { id: 1 },
  //   //     };
  //   //     const res = {
  //   //       json: sinon.spy(),
  //   //     };

  //   //     // Mock database query to return an expired timer data
  //   //     const pool = {
  //   //       query: sinon.stub().resolves([
  //   //         {
  //   //           hours: 0,
  //   //           minutes: 0,
  //   //           seconds: 0,
  //   //           start_time: new Date(),
  //   //         },
  //   //       ]),
  //   //     };
  //   //     sinon.replace(require("../src/database/db"), "query", pool.query);

  //   //     // Mock the current time to simulate an expired timer
  //   //     const currentTime = new Date();
  //   //     currentTime.setHours(currentTime.getHours() + 1); // Add 1 hour
  //   //     const nowStub = sinon.stub(Date, "now").returns(currentTime.getTime());

  //   //     await getTimerStatus(req, res);

  //   //     assert(res.json.calledWith({ id: 1, time_left: 0 }));

  //   //     // Restore the original Date.now() function
  //   //     nowStub.restore();
  //   //   });

  //   //   it("should return an error for a non-existing timer", async () => {
  //   //     const req = {
  //   //       params: { id: 999 }, // Non-existing timer ID
  //   //     };
  //   //     const res = {
  //   //       json: sinon.spy(),
  //   //       status: sinon.stub().returnsThis(),
  //   //     };

  //   //     // Mock database query to return no results
  //   //     const pool = {
  //   //       query: sinon.stub().resolves([]),
  //   //     };
  //   //     sinon.replace(require("../src/database/db"), "query", pool.query);

  //   //     await getTimerStatus(req, res);

  //   //     assert(res.status.calledWith(404));
  //   //     assert(res.json.calledWith({ error: "Timer not found" }));
  //   //   });
  //   // });

  //   // describe("checkAndTriggerExpiredTimers", () => {
  //   //   it("should trigger expired timers and mark them as completed", async () => {
  //   //     // Mock database query to return expired timers
  //   //     const pool = {
  //   //       query: sinon.stub().resolves([
  //   //         {
  //   //           id: 1,
  //   //           url: "http://example.com",
  //   //         },
  //   //       ]),
  //   //     };
  //   //     sinon.replace(require("../src/database/db"), "query", pool.query);

  //   //     // Mock axios post requests
  //   //     axios.post.resolves({}); // Successful POST request

  //   //     await checkAndTriggerExpiredTimers();

  //   //     // Assert that axios.post was called with the correct URL
  //   //     assert(axios.post.calledOnce);
  //   //     assert(axios.post.calledWith("http://example.com/1"));

  //   //     // Assert that markTimerAsCompleted was called
  //   //     assert(pool.query.calledOnce);
  //   //     assert(
  //   //       pool.query.calledWith("UPDATE timers SET status = ?", ["completed"])
  //   //     );
  //   //   });

  //   //   it("should handle errors when triggering expired timers", async () => {
  //   //     // Mock database query to return expired timers
  //   //     const pool = {
  //   //       query: sinon.stub().resolves([
  //   //         {
  //   //           id: 1,
  //   //           url: "http://example.com",
  //   //         },
  //   //       ]),
  //   //     };
  //   //     sinon.replace(require("../src/database/db"), "query", pool.query);

  //   //     // Mock axios post requests to simulate an error
  //   //     axios.post.rejects(new Error("Webhook error"));

  //   //     await checkAndTriggerExpiredTimers();

  //   //     // Assert that axios.post was called with the correct URL
  //   //     assert(axios.post.calledOnce);
  //   //     assert(axios.post.calledWith("http://example.com/1"));

  //   //     // Assert that markTimerAsCompleted was not called due to the error
  //   //     assert(pool.query.notCalled);
  //   //   });
  //   // });

  //   // describe("markTimerAsCompleted", () => {
  //   //   it("should mark a timer as completed in the database", async () => {
  //   //     const pool = {
  //   //       query: sinon.stub().resolves({}),
  //   //     };
  //   //     sinon.replace(require("../src/database/db"), "query", pool.query);

  //   //     await markTimerAsCompleted(1);

  //   //     // Assert that the query was called with the correct parameters
  //   //     assert(pool.query.calledOnce);
  //   //     assert(
  //   //       pool.query.calledWith("UPDATE timers SET status = ?", ["completed"])
  //   //     );
  //   //   });

  //   //   it("should handle errors when marking a timer as completed", async () => {
  //   //     const pool = {
  //   //       query: sinon.stub().rejects(new Error("Database error")),
  //   //     };
  //   //     sinon.replace(require("../src/database/db"), "query", pool.query);

  //   //     await markTimerAsCompleted(1);

  //   //     // Assert that the query was called with the correct parameters
  //   //     assert(pool.query.calledOnce);
  //   //     assert(
  //   //       pool.query.calledWith("UPDATE timers SET status = ?", ["completed"])
  //   //     );
  //   //   });
  //   // });

  //   // describe("cleanupCompletedTimers", () => {
  //   //   it("should delete completed timers older than a certain threshold", async () => {
  //   //     const pool = {
  //   //       query: sinon.stub().resolves({}),
  //   //     };
  //   //     sinon.replace(require("../src/database/db"), "query", pool.query);

  //   //     await cleanupCompletedTimers();

  //   //     // Assert that the query was called with the correct parameters
  //   //     assert(pool.query.calledOnce);
  //   //     assert(
  //   //       pool.query.calledWith(
  //   //         "DELETE FROM timers WHERE status = ? AND start_time <= ?",
  //   //         ["completed", sinon.match.instanceOf(Date)]
  //   //       )
  //   //     );
  //   //   });

  //   //   it("should handle errors when cleaning up completed timers", async () => {
  //   //     const pool = {
  //   //       query: sinon.stub().rejects(new Error("Database error")),
  //   //     };
  //   //     sinon.replace(require("../src/database/db"), "query", pool.query);

  //   //     await cleanupCompletedTimers();

  //   //     // Assert that the query was called with the correct parameters
  //   //     assert(pool.query.calledOnce);
  //   //     assert(
  //   //       pool.query.calledWith(
  //   //         "DELETE FROM timers WHERE status = ? AND start_time <= ?",
  //   //         ["completed", sinon.match.instanceOf(Date)]
  //   //       )
  //   //     );
  //   //   });
  //   // });
});
