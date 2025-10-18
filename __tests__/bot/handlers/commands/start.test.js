jest.resetModules();
jest.doMock("../../../../bot/utils/checkUserExists", () => ({
    checkUserExists: jest.fn(),
}));

const { checkUserExists } = require("../../../../bot/utils/checkUserExists");
const startModule = require("../../../../bot/handlers/commands/start");

describe("start command", () => {
    test("returns early for non-private chat", async () => {
        const bot = { start: (fn) => fn({ chat: { type: "group" } }) };
        startModule(bot);
        // nothing to assert other than no throw
    });

    test("prompts for username when missing", async () => {
        const replies = [];
        const ctx = {
            chat: { type: "private" },
            from: { username: null },
            reply: async (t) => replies.push(t),
        };
        const bot = { start: (fn) => fn(ctx) };
        startModule(bot);
        expect(replies.length).toBe(1);
        expect(replies[0]).toMatch(/یوزرنیم/);
    });

    test("registered user flow sets session registered true and replies with menu", async () => {
        checkUserExists.mockResolvedValue(true);
        const replies = [];
        const ctx = {
            chat: { type: "private" },
            from: { username: "u", id: 42, first_name: "A", last_name: "B" },
            session: {},
            reply: async (text, opts) => replies.push({ text, opts }),
        };
        const bot = { start: (fn) => fn(ctx) };
        startModule(bot);
        // wait for microtasks
        await Promise.resolve();
        expect(ctx.session.registered).toBe(true);
        expect(replies[0].text).toMatch(/ثبت‌نام شما قبلاً انجام شده است/);
    });

    test("unregistered user asks for full name", async () => {
        checkUserExists.mockResolvedValue(false);
        const replies = [];
        const ctx = {
            chat: { type: "private" },
            from: { username: "u", id: 43, first_name: "Ali", last_name: "" },
            session: {},
            reply: async (text, opts) => replies.push({ text, opts }),
        };
        const bot = { start: (fn) => fn(ctx) };
        startModule(bot);
        await Promise.resolve();
        expect(ctx.session.registered).toBe(false);
        expect(replies[0].text).toMatch(/سلام Ali/);
    });
});
