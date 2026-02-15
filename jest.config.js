export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/test/**/*.test.js"],
  setupFiles: ["<rootDir>/test/setup.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/**/*.test.js"],
  coverageDirectory: "coverage",
  verbose: true,
  testTimeout: 10000,
};
