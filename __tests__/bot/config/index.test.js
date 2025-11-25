/* eslint-env jest */

const path = "../../../bot/config";

describe("bot/config/index.js", () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        // start each test with a clean environment to avoid host contamination
        process.env = {};
    });

    afterEach(() => {
        process.env = OLD_ENV;
        jest.restoreAllMocks();
    });

    test("non-production: missing required vars warns and ALLOWED_GROUPS missing warns", () => {
        // Start test with empty env so warnings occur predictably
        process.env = {};

        const warnSpy = jest
            .spyOn(console, "warn")
            .mockImplementation(() => {});

        let config;
        expect(() => {
            // load under isolated modules and mock dotenv so .env doesn't leak into tests
            jest.isolateModules(() => {
                jest.doMock("dotenv", () => ({ config: () => {} }));
                // eslint-disable-next-line global-require
                config = require(path);
            });
        }).not.toThrow();

        // Default PORT should be 3000 when not provided (or if an external PORT exists, ensure it's numeric)
        // Accept either the numeric default or the environment value if present in the OS environment.
        const numericPort = Number(config.PORT);
        expect(Number.isFinite(numericPort)).toBe(true);
        expect([3000, Number(process.env.PORT)]).toContain(numericPort);

        // ALLOWED_GROUPS should be an empty array and a warning emitted
        expect(Array.isArray(config.ALLOWED_GROUPS)).toBe(true);
        expect(config.ALLOWED_GROUPS.length).toBe(0);

        // Ensure each required env produced a warn call (message includes the missing key)
        const requiredKeys = [
            "TELEGRAM_BOT_TOKEN",
            "PERPLEXITY_API_KEY",
            "USERNAME_SPECIAL_FN",
            "ENCRYPTION_KEY",
            "ADMIN_USERNAME",
            "NOTION_API_KEY",
            "NOTION_DATABASE_ID",
            "ADMIN_CHAT_ID",
        ];
        for (const key of requiredKeys) {
            expect(
                warnSpy.mock.calls.some(
                    (c) => c[0] && String(c[0]).includes(key)
                )
            ).toBe(true);
        }

        // Also ALLOWED_GROUPS warning
        expect(
            warnSpy.mock.calls.some(
                (c) => c[0] && String(c[0]).includes("ALLOWED_GROUPS")
            )
        ).toBe(true);
    });

    test("parses ALLOWED_GROUPS and respects provided PORT and required vars (non-production)", () => {
        jest.resetModules();

        process.env.NODE_ENV = undefined;
        process.env.TELEGRAM_BOT_TOKEN = "t";
        process.env.PERPLEXITY_API_KEY = "p";
        process.env.USERNAME_SPECIAL_FN = "u";
        process.env.ENCRYPTION_KEY = "e";
        process.env.ADMIN_USERNAME = "admin";
        process.env.NOTION_API_KEY = "n";
        process.env.NOTION_DATABASE_ID = "d";
        process.env.ADMIN_CHAT_ID = "42";
        process.env.ALLOWED_GROUPS = "0,123,,5";
        process.env.PORT = "8080";

        const warnSpy = jest
            .spyOn(console, "warn")
            .mockImplementation(() => {});

        let config;
        jest.isolateModules(() => {
            jest.doMock("dotenv", () => ({ config: () => {} }));
            config = require(path);
        });

        expect(config.ALLOWED_GROUPS).toEqual([123, 5]);

        expect(config.PORT).toBe("8080");
        
        warnSpy.mockRestore();
    });

    test("production: missing required var throws an error", () => {
        // Make sure we are in production and that TELEGRAM_BOT_TOKEN is not set.
        process.env.NODE_ENV = "production";
        delete process.env.TELEGRAM_BOT_TOKEN;
        delete process.env.PERPLEXITY_API_KEY;
        delete process.env.USERNAME_SPECIAL_FN;
        delete process.env.ENCRYPTION_KEY;
        delete process.env.ADMIN_USERNAME;
        delete process.env.NOTION_API_KEY;
        delete process.env.NOTION_DATABASE_ID;
        delete process.env.ADMIN_CHAT_ID;

        expect(() => {
            jest.isolateModules(() => {
                jest.doMock("dotenv", () => ({ config: () => {} }));
                // eslint-disable-next-line global-require
                require(path);
            });
        }).toThrow(/TELEGRAM_BOT_TOKEN is not set/);
    });

    test("production: all required present but ALLOWED_GROUPS missing throws", () => {
        process.env.NODE_ENV = "production";
        process.env.TELEGRAM_BOT_TOKEN = "t";
        process.env.PERPLEXITY_API_KEY = "p";
        process.env.USERNAME_SPECIAL_FN = "u";
        process.env.ENCRYPTION_KEY = "e";
        process.env.ADMIN_USERNAME = "admin";
        process.env.NOTION_API_KEY = "n";
        process.env.NOTION_DATABASE_ID = "d";
        process.env.ADMIN_CHAT_ID = "42";
        delete process.env.ALLOWED_GROUPS;

        expect(() => {
            jest.isolateModules(() => {
                jest.doMock("dotenv", () => ({ config: () => {} }));
                // eslint-disable-next-line global-require
                require(path);
            });
        }).toThrow(/ALLOWED_GROUPS is not set/);
    });

    test("production: valid ALLOWED_GROUPS and all required vars does not throw", () => {
        process.env.NODE_ENV = "production";
        process.env.TELEGRAM_BOT_TOKEN = "t";
        process.env.PERPLEXITY_API_KEY = "p";
        process.env.USERNAME_SPECIAL_FN = "u";
        process.env.ENCRYPTION_KEY = "e";
        process.env.ADMIN_USERNAME = "admin";
        process.env.NOTION_API_KEY = "n";
        process.env.NOTION_DATABASE_ID = "d";
        process.env.ADMIN_CHAT_ID = "42";
        process.env.ALLOWED_GROUPS = "1,2";

        let config;
        expect(() => {
            jest.isolateModules(() => {
                jest.doMock("dotenv", () => ({ config: () => {} }));
                // eslint-disable-next-line global-require
                config = require(path);
            });
        }).not.toThrow();

        expect(config.ALLOWED_GROUPS).toEqual([1, 2]);
    });
});
