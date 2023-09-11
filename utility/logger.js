const pino = require("pino");
const pretty = require("pino-pretty");

const stream = pretty({
  colorize: true,
  ignore: "pid,hostname",
  timestamp: false,
  customPrettifiers: {
    time: () => `[${new Date().toISOString()}]`,
  },
});
const loggger = pino({ level: "info" }, stream);

module.exports = loggger;
