const cfg = require("../commitlint.config.js");

describe("commitlint.config", () => {
    test("exports header-max-length rule and ignores release chore", () => {
        expect(cfg).toBeDefined();
        expect(cfg.rules).toBeDefined();
        // header-max-length rule should be configured to 200
        expect(cfg.rules["header-max-length"][2]).toBe(200);

        // ignores should contain the release chore matcher and it should return true
        const fn = cfg.ignores && cfg.ignores[0];
        expect(typeof fn).toBe("function");
        expect(fn("chore(release): 🔖 bump version to 1.0.0")).toBe(true);
    });
});
