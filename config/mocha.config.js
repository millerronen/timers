module.exports = {
  // Mocha options
  timeout: 5000, // Set a global timeout for test cases (in milliseconds)
  recursive: true, // Recursively search for test files in subdirectories
  require: ["chai/register-expect"], // Require Chai's expect-style assertions

  // Reporters (optional, choose one)
  // reporters: ['spec', 'nyan', 'dot'],

  // Environment setup (optional)
  // before: () => {
  //   // Code to run before all tests
  // },
  // after: () => {
  //   // Code to run after all tests
  // },

  // Custom reporters (optional)
  // reporterOptions: {
  //   mochawesome: {
  //     output: './mochawesome-report', // Specify a directory for mochawesome reports
  //   },
  // },

  // Specifying test files (optional)
  // files: ['test/**/*.js'], // Specify an array of test files to run
};
