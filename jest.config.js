module.exports = {
    testEnvironment: "node",
    collectCoverage: true,
    // include all js files except node_modules, coverage data and tests
    collectCoverageFrom: [
        "**/*.js",
        "!node_modules/**",
        "!coverage/**",
        "!**/__tests__/**",
        "!**/coverage/**",
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "json-summary"],
    testMatch: ["**/__tests__/**/*.test.js"],
};
