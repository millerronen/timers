const axios = require("axios");
const { createTimer } = require("../src/controllers/timerController");
const { expect } = require("chai");
const sinon = require("sinon");

describe("createTimer", () => {
  const axios = require("axios");
  const { createTimer } = require("../src/controllers/timerController");
  const { expect } = require("chai");
  const sinon = require("sinon");

  describe("createTimer", () => {
    let mockPool;
    let mockConnection;
    let axiosPost;

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

      // Mock the axios post method
      axiosPost = sinon.stub(axios, "post");
      axiosPost.resolves({});
    });

    afterEach(() => {
      // Restore the original functions after each test
      mockPool.restore();
      axiosPost.restore();
    });

    it("should create a timer and return the timer ID and time left", async () => {
      // Arrange
      const req = {
        body: {
          hours: 1,
          minutes: 0,
          seconds: 0,
          url: "http://example.com",
        },
      };
      const res = {
        json: sinon.stub(),
      };

      // Mock the INSERT query result
      const mockInsertResult = {
        insertId: 1, // Replace with the expected ID
      };

      // Mock the database query to return the insert result
      mockConnection.query.resolves([mockInsertResult]);

      // Act
      await createTimer(req, res);

      // Assert
      sinon.assert.calledOnce(res.json);
      sinon.assert.calledWithMatch(res.json, {
        id: mockInsertResult.insertId,
        time_left: 3600, // Adjust based on your input values
      });
    });

    // Add more test cases as needed
  });
});

describe("validateInput", () => {
  let mockPool;
  let mockConnection;
  let axiosPost;

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

    // Mock the axios post method
    axiosPost = sinon.stub(axios, "post");
    axiosPost.resolves({});
  });

  afterEach(() => {
    // Restore the original functions after each test
    mockPool.restore();
    axiosPost.restore();
  });

  it("should return true for valid input", async () => {
    // Arrange
    const req = {
      body: {
        hours: 1,
        minutes: 0,
        seconds: 0,
        url: "http://example.com",
      },
    };
    const res = {
      json: sinon.stub(),
    };

    // Mock the INSERT query result
    const mockInsertResult = {
      insertId: 1, // Replace with the expected ID
    };

    // Mock the database query to return the insert result
    mockConnection.query.resolves([mockInsertResult]);
    // Act
    await createTimer(req, res);

    // Assert
    sinon.assert.calledOnce(res.json);
    sinon.assert.calledWithMatch(res.json, {
      id: mockInsertResult.insertId,
      time_left: 3600, // Adjust based on your input values
    });
  });

  it("should return false for non-integer hours", async () => {
    // Invalid input: Hours is not an integer
    const req = {
      body: {
        hours: "1",
        minutes: 0,
        seconds: 0,
        url: "http://example.com",
      },
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    // Act
    await createTimer(req, res);

    // Assert
    sinon.assert.calledWith(res.status, 400);
    sinon.assert.calledOnce(res.json);
  });

  it("should return false for non-integer minutes", async () => {
    // Invalid input: Minutes is not an integer
    const req = {
      body: {
        hours: 1,
        minutes: "0",
        seconds: 0,
        url: "http://example.com",
      },
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    // Act
    await createTimer(req, res);

    // Assert
    sinon.assert.calledWith(res.status, 400);
    sinon.assert.calledOnce(res.json);
  });

  it("should return false for non-integer seconds", async () => {
    // Invalid input: Minutes is not an integer
    const req = {
      body: {
        hours: 1,
        minutes: 0,
        seconds: "0",
        url: "http://example.com",
      },
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    // Act
    await createTimer(req, res);

    // Assert
    sinon.assert.calledWith(res.status, 400);
    sinon.assert.calledOnce(res.json);
  });

  it("should return false for an invalid URL", async () => {
    // Invalid input: Minutes is not an integer
    const req = {
      body: {
        hours: 1,
        minutes: 0,
        seconds: "0",
        url: "example.com",
      },
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    // Act
    await createTimer(req, res);

    // Assert
    sinon.assert.calledWith(res.status, 400);
    sinon.assert.calledOnce(res.json);
  });

  it("should return false for a duration exceeding 30 days", async () => {
    // Invalid input: Total duration exceeds 30 days (31 days)
    const req = {
      body: {
        hours: 31 * 24,
        minutes: 0,
        seconds: 0,
        url: "http://example.com",
      },
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    // Act
    await createTimer(req, res);

    // Assert
    sinon.assert.calledWith(res.status, 400);
    sinon.assert.calledOnce(res.json);
  });
  it("should return an error for an empty request body", async () => {
    // Empty input: No data in the request body
    const req = {
      body: {},
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    // Act
    await createTimer(req, res);

    // Assert
    sinon.assert.calledWith(res.status, 400);
    sinon.assert.calledOnce(res.json);
  });
});
