jest.resetModules();

// mock Notion client and expose a pages.create mock we can control per-test
const pagesCreateMock = jest.fn();
jest.doMock("@notionhq/client", () => ({
    Client: jest.fn(() => ({ pages: { create: pagesCreateMock } })),
}));

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

const registrationModule = require("../../../../bot/handlers/commands/registrationHandler");
const { showMainMenu } = require("../../../../bot/handlers/scenes/mainMenu");
const { checkUserExists } = require("../../../../bot/utils/checkUserExists");

beforeEach(() => {
    jest.clearAllMocks();
    pagesCreateMock.mockReset();
});

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

test("registration continues when checkUserExists throws and still prompts for track", async () => {
    checkUserExists.mockRejectedValue(new Error("boom"));
    const replies = [];
    const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

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
    await new Promise((resolve) => setImmediate(resolve));

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(ctx.session.awaitingTrack).toBe(true);
});

test("registration warns but continues if deleting the checking message fails", async () => {
    checkUserExists.mockResolvedValue(false);
    const replies = [];
    const consoleWarnSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

    const ctx = {
        chat: { type: "private", id: 10 },
        session: {},
        message: { text: "Ali Reza" },
        from: { id: 5, username: "u", first_name: "A", last_name: "B" },
        reply: async (t, opts) => replies.push({ t, opts }),
        telegram: {
            deleteMessage: async () => {
                throw new Error("del fail");
            },
        },
    };
    const bot = { on: (evt, fn) => fn(ctx, () => {}) };

    registrationModule(bot);
    await new Promise((resolve) => setImmediate(resolve));

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(ctx.session.awaitingTrack).toBe(true);
});

test("registration returns early when user is already registered", async () => {
    checkUserExists.mockResolvedValue(true);
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
    await new Promise((resolve) => setImmediate(resolve));

    expect(ctx.session.registered).toBe(true);
    expect(replies.some((r) => r.t.includes("نیازی به ثبت‌نام"))).toBe(true);
});

test("successful registration flow creates a Notion page and notifies admin", async () => {
    checkUserExists.mockResolvedValue(false);
    pagesCreateMock.mockResolvedValue({});

    const replies = [];
    const ctx = {
        chat: { type: "private", id: 10 },
        session: { fullNameInput: "Ali Reza", awaitingTrack: true },
        message: { text: "Web" },
        from: { id: 5, username: "u", first_name: "A", last_name: "B" },
        reply: async (t, _opts) => {
            // simulate loading and other replies
            if (t.includes("در حال ثبت اطلاعات شما")) {
                return { message_id: 999 };
            }
            replies.push(t);

            return null;
        },
        telegram: {
            editMessageText: async () => {},
            sendMessage: jest.fn(),
        },
    };
    const bot = { on: (evt, fn) => fn(ctx, () => {}) };

    registrationModule(bot);
    await new Promise((resolve) => setImmediate(resolve));

    expect(pagesCreateMock).toHaveBeenCalled();
    expect(ctx.session.registered).toBe(true);
    expect(showMainMenu).toHaveBeenCalled();
    expect(ctx.telegram.sendMessage).toHaveBeenCalledWith(
        "1",
        expect.stringContaining("یک کاربر جدید در بات ثبت‌نام کرد"),
        { parse_mode: "HTML" }
    );
});

test("registration handles editMessageText failing by warning and replying success", async () => {
    checkUserExists.mockResolvedValue(false);
    pagesCreateMock.mockResolvedValue({});
    const consoleWarnSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

    const replies = [];
    const ctx = {
        chat: { type: "private", id: 10 },
        session: { fullNameInput: "Ali Reza", awaitingTrack: true },
        message: { text: "C#" },
        from: { id: 5, username: "u", first_name: "A", last_name: "B" },
        reply: async (t, _opts) => {
            if (t.includes("در حال ثبت اطلاعات شما")) {
                return { message_id: 1000 };
            }
            replies.push(t);
            return null;
        },
        telegram: {
            editMessageText: async () => {
                throw new Error("edit fail");
            },
            sendMessage: jest.fn(),
        },
    };
    const bot = { on: (evt, fn) => fn(ctx, () => {}) };

    registrationModule(bot);
    await new Promise((resolve) => setImmediate(resolve));

    expect(consoleWarnSpy).toHaveBeenCalled();
    // success message should be sent via ctx.reply fallback
    expect(
        replies.some((r) => r.includes("اطلاعات شما با موفقیت ثبت شد"))
    ).toBe(true);
    expect(showMainMenu).toHaveBeenCalled();
});

test("registration replies with error when Notion saving fails", async () => {
    checkUserExists.mockResolvedValue(false);
    pagesCreateMock.mockRejectedValue(new Error("notion fail"));

    const replies = [];
    const ctx = {
        chat: { type: "private", id: 10 },
        session: { fullNameInput: "Ali Reza", awaitingTrack: true },
        message: { text: "Machine Learning" },
        from: { id: 5, username: "u", first_name: "A", last_name: "B" },
        reply: async (t) => replies.push(t),
        telegram: {
            editMessageText: async () => {},
            sendMessage: async () => {},
        },
    };
    const bot = { on: (evt, fn) => fn(ctx, () => {}) };

    registrationModule(bot);
    await new Promise((resolve) => setImmediate(resolve));

    expect(
        replies.some((r) => r.includes("مشکلی در ذخیره اطلاعات پیش آمده است"))
    ).toBe(true);
});
