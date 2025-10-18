jest.resetModules();
const path = require("path");

describe("bot/config index", () => {
    const ORIGINAL_ENV = process.env;
    beforeEach(() => {
        jest.resetModules(); // clear module cache
        process.env = { ...ORIGINAL_ENV };
    });
    afterEach(() => {
        process.env = ORIGINAL_ENV;
    });

    test("exports values when env variables present", () => {
        process.env.TELEGRAM_BOT_TOKEN = "T";
        process.env.PERPLEXITY_API_KEY = "P";
        process.env.ALLOWED_GROUPS = "1,2,3";
        process.env.USERNAME_SPECIAL_FN = "fn";
        process.env.ENCRYPTION_KEY = "enc";
        process.env.ADMIN_USERNAME = "admin";
        process.env.NOTION_API_KEY = "nkey";
        process.env.NOTION_DATABASE_ID = "nid";
        process.env.ADMIN_CHAT_ID = "aid";

        const cfg = require("../../../bot/config");
        expect(cfg.TELEGRAM_BOT_TOKEN).toBe("T");
        expect(cfg.PERPLEXITY_API_KEY).toBe("P");
        expect(cfg.ALLOWED_GROUPS).toEqual([1, 2, 3]);
        expect(cfg.ADMIN_USERNAME).toBe("admin");
        expect(cfg.NOTION_API_KEY).toBe("nkey");
        expect(cfg.NOTION_DATABASE_ID).toBe("nid");
    });

    test("throws when required env vars missing", () => {
        // set required vars to empty strings so checks that use !value will fail
        process.env.TELEGRAM_BOT_TOKEN = "";
        process.env.PERPLEXITY_API_KEY = "";
        process.env.ALLOWED_GROUPS = "";
        process.env.USERNAME_SPECIAL_FN = "";
        process.env.ENCRYPTION_KEY = "";
        process.env.ADMIN_USERNAME = "";
        process.env.NOTION_API_KEY = "";
        process.env.NOTION_DATABASE_ID = "";
        process.env.ADMIN_CHAT_ID = "";
        // force production behavior so missing required env vars cause an exception
        process.env.NODE_ENV = "production";
        delete require.cache[require.resolve("../../../bot/config")];
        expect(() => require("../../../bot/config")).toThrow();
    });
});
