module.exports = {
    testEnvironment: "node",
    collectCoverage: true,
    collectCoverageFrom: ["bot/utils/**/*.js"],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov"],
    testMatch: ["**/__tests__/**/*.test.js"],
};
