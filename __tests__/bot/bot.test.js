jest.resetModules();

jest.doMock("telegraf", () => ({
    Telegraf: function (token) {
        this.token = token;
        this.use = function () {};
        this.launch = jest.fn().mockResolvedValue();
        this.stop = jest.fn();
    },
    session: () => (_req, _res, _next) => {},
}));

jest.doMock("../../bot/registerHandlers", () => jest.fn((_b) => {}));

jest.doMock("../../bot/config", () => ({ TELEGRAM_BOT_TOKEN: "T" }));

const bot = require("../../bot");

describe("bot module", () => {
    test("exports a Telegraf instance", () => {
        expect(bot).toBeDefined();
        expect(bot.token).toBe("T");
    });
});
