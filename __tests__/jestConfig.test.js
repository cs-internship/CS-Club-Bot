test("jest.config exports expected properties", () => {
    const cfg = require("../jest.config.js");
    expect(cfg).toBeDefined();
    expect(cfg.testEnvironment).toBe("node");
    expect(Array.isArray(cfg.collectCoverageFrom)).toBe(true);
});
