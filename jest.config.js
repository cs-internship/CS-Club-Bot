module.exports = {
    testEnvironment: "node",
    collectCoverage: true,
    collectCoverageFrom: [
        "**/*.js",
        "!node_modules/**",
        "!coverage/**",
        "!**/__tests__/**",
        "!**/coverage/**",
        "!scripts/**",
    ],
    coverageDirectory: "coverage",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    testPathIgnorePatterns: ["/node_modules/", "/coverage/", "/scripts/"],
};
