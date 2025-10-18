jest.resetModules();

jest.doMock("../../../../bot/utils/checkUserExists", () => ({
    checkUserExists: jest.fn(),
}));
jest.doMock("../../../../bot/handlers/scenes/mainMenu", () => ({
    showMainMenu: jest.fn(),
}));
jest.doMock("../../../../bot/config", () => ({
    NOTION_DATABASE_ID: "db",
    NOTION_API_KEY: "key",
    ADMIN_CHAT_ID: "1",
}));

const { checkUserExists } = require("../../../../bot/utils/checkUserExists");
const registrationModule = require("../../../../bot/handlers/commands/registrationHandler");

test("registration returns next for non-private or already registered", () => {
    const ctx = { chat: { type: "group" }, session: { registered: false } };
    const bot = { on: (evt, fn) => fn(ctx, () => {}) };
    // should not throw
    expect(() => registrationModule(bot)).not.toThrow();
});

test("registration prompts for fullname when not registered and provides tracks", async () => {
    checkUserExists.mockResolvedValue(false);
    const replies = [];
    const ctx = {
        chat: { type: "private", id: 10 },
        session: {},
        message: { text: "Ali Reza" },
        from: { id: 5, username: "u", first_name: "A", last_name: "B" },
        reply: async (t, opts) => replies.push({ t, opts }),
        telegram: { deleteMessage: async () => {} },
    };
    const bot = { on: (evt, fn) => fn(ctx, () => {}) };

    registrationModule(bot);
    // allow async work in the handler to complete
    await new Promise((resolve) => setImmediate(resolve));
    // after flow, session.awaitingTrack should be true
    expect(ctx.session.awaitingTrack).toBe(true);
    expect(replies.some((r) => r.t.includes("دوره"))).toBe(true);
});

test("registration handles invalid track selection", async () => {
    checkUserExists.mockResolvedValue(false);
    const replies = [];
    const ctx = {
        chat: { type: "private", id: 10 },
        session: { fullNameInput: "Ali", awaitingTrack: true },
        message: { text: "InvalidTrack" },
        from: { id: 5, username: "u" },
        reply: async (t) => replies.push(t),
        telegram: { sendMessage: async () => {} },
    };
    const bot = { on: (evt, fn) => fn(ctx, () => {}) };

    registrationModule(bot);
    await Promise.resolve();
    expect(replies[0]).toMatch(
        /لطفاً یکی از گزینه‌های ارائه‌شده را انتخاب نمایید/
    );
});
