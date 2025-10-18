jest.resetModules();

jest.doMock("../../../../bot/config", () => ({ ADMIN_CHAT_ID: 999 }));

const directModule = require("../../../../bot/handlers/commands/directMessage");

test("direct command validates admin and arguments and sends message", async () => {
    const sent = [];
    const replies = [];
    // bot.command should call the registered handler immediately with ctx
    const ctx = {
        chat: { id: 999 },
        message: { text: "/direct 42 Hello there" },
        reply: async (t) => replies.push(t),
    };

    const bot = {
        telegram: {
            sendMessage: (id, text, opts) => sent.push({ id, text, opts }),
        },
        command: (name, fn) => fn(ctx),
    };

    directModule(bot);
    // allow any async handlers to complete
    await Promise.resolve();
    expect(sent.length).toBe(1);
    expect(String(sent[0].id)).toBe("42");
    expect(sent[0].text).toMatch(/Hello there/);
    expect(replies.length).toBeGreaterThanOrEqual(0);
});

test("direct does nothing for non-admin", async () => {
    const sent = [];
    const replies = [];
    const ctx = {
        chat: { id: 111 },
        message: { text: "/direct 42 Hello there" },
        reply: async (t) => replies.push(t),
    };
    const bot = {
        telegram: {
            sendMessage: (id, text, opts) => sent.push({ id, text, opts }),
        },
        command: (name, fn) => fn(ctx),
    };
    directModule(bot);
    expect(sent.length).toBe(0);
    expect(replies.length).toBe(0);
});

test("direct replies usage when arguments missing", async () => {
    const sent = [];
    const replies = [];
    const ctx = {
        chat: { id: 999 },
        message: { text: "/direct" },
        reply: async (t) => replies.push(t),
    };

    const bot = {
        telegram: {
            sendMessage: (id, text, opts) => sent.push({ id, text, opts }),
        },
        command: (name, fn) => fn(ctx),
    };

    directModule(bot);
    await new Promise((r) => setImmediate(r));
    expect(sent.length).toBe(0);
    expect(replies.length).toBe(1);
    expect(replies[0]).toMatch(/\/direct <telegram_id>/);
});

test("direct handles sendMessage throwing and replies with error", async () => {
    const replies = [];
    console.error = jest.fn();

    const ctx = {
        chat: { id: 999 },
        message: { text: "/direct 42 Hello" },
        reply: async (t) => replies.push(t),
    };

    const bot = {
        telegram: {
            sendMessage: async () => {
                throw new Error("boom");
            },
        },
        command: (name, fn) => fn(ctx),
    };

    directModule(bot);
    await new Promise((r) => setImmediate(r));
    expect(console.error).toHaveBeenCalled();
    expect(replies.some((r) => r.includes("ارسال پیام"))).toBe(true);
});
