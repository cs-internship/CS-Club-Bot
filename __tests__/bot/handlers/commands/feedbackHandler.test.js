jest.resetModules();

jest.doMock("../../../../bot/utils/checkUserBanned", () => ({
    checkUserBanned: jest.fn(),
}));
jest.doMock("../../../../bot/utils/getUsernameByFullname", () => ({
    getUsernameByFullname: jest.fn(),
}));
jest.doMock("../../../../bot/config", () => ({
    USERNAME_SPECIAL_FN: "x=>x",
    ENCRYPTION_KEY: "k",
    FORM_BASE_URL: "https://form",
}));

const { checkUserBanned } = require("../../../../bot/utils/checkUserBanned");
const {
    getUsernameByFullname,
} = require("../../../../bot/utils/getUsernameByFullname");
const feedbackModule = require("../../../../bot/handlers/commands/feedbackHandler");

// helper to create bot that immediately calls on('text') handler with ctx
const makeBotAndRun = (ctx) => {
    const bot = { on: (evt, fn) => fn(ctx, () => {}) };
    feedbackModule(bot);
};

test("feedback returns on back button", () => {
    const ctx = {
        message: { text: "🔙 بازگشت" },
        session: { step: "awaiting_user_selection" },
        reply: async () => {},
    };
    expect(() => makeBotAndRun(ctx)).not.toThrow();
});

test("feedback prompts when invalid selection", async () => {
    const replies = [];
    const ctx = {
        message: { text: "NotInList" },
        session: {
            step: "awaiting_user_selection",
            availableUsers: ["A", "B"],
        },
        reply: async (t) => replies.push(t),
    };
    makeBotAndRun(ctx);
    expect(replies[0]).toMatch(/لطفاً یکی از گزینه‌های موجود/);
});

test("feedback handles awaiting_feedback without username", async () => {
    const replies = [];
    const ctx = {
        message: { text: "hi" },
        session: { step: "awaiting_feedback", selectedUser: "A" },
        from: { username: null },
        reply: async (t) => replies.push(t),
    };
    makeBotAndRun(ctx);
    expect(replies[0]).toMatch(/یوزرنیم شما وجود ندارد/);
});

test("feedback handles banned user", async () => {
    checkUserBanned.mockResolvedValue(true);
    const replies = [];
    const ctx = {
        message: { text: "hi" },
        session: { step: "awaiting_feedback", selectedUser: "A" },
        from: { username: "u" },
        reply: async (t) => replies.push(t),
    };
    await makeBotAndRun(ctx);
    expect(replies[0]).toMatch(/بن شده/);
});

test("feedback builds and replies with feedback url", async () => {
    checkUserBanned.mockResolvedValue(false);
    getUsernameByFullname.mockResolvedValue("helperUser");
    const replies = [];
    const ctx = {
        message: { text: "hi" },
        session: { step: "awaiting_feedback", selectedUser: "Helper" },
        from: { username: "me" },
        reply: async (t, opts) => replies.push({ t, opts }),
        deleteMessage: async () => {},
    };
    await makeBotAndRun(ctx);
    // allow async work
    await Promise.resolve();
    // reply should contain the helper username mention and an HTML formatted message
    expect(
        replies.some(
            (r) => typeof r.t === "string" && r.t.includes("@helperUser")
        )
    ).toBe(true);
});
