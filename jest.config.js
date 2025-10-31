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
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    testPathIgnorePatterns: ["/node_modules/", "/coverage/"],
};
