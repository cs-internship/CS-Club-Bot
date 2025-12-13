const loadModule = (configOverrides = {}) => {
    jest.resetModules();
    jest.doMock("../../../../package.json", () => ({ version: "1.2.3" }));
    jest.doMock("../../../../bot/config", () => ({
        ALLOWED_GROUPS: [999],
        IS_TEST_BOT: false,
        ...configOverrides,
    }));
    return require("../../../../bot/handlers/commands/version");
};

test("version replies in group when allowed", () => {
    const replies = [];
    const ctx = {
        chat: { type: "group", id: 999 },
        reply: (text) => replies.push(text),
    };
    const bot = { command: (name, fn) => fn(ctx) };
    const versionModule = loadModule();
    versionModule(bot);
    expect(replies[0]).toBe("🤖 Bot version: 1.2.3");
});

test("version replies with test suffix when bot is flagged as test", () => {
    const replies = [];
    const ctx = {
        chat: { type: "group", id: 999 },
        reply: (text) => replies.push(text),
    };
    const bot = { command: (name, fn) => fn(ctx) };
    const versionModule = loadModule({ IS_TEST_BOT: true });
    versionModule(bot);
    expect(replies[0]).toBe("🤖 Bot version: 1.2.3 - test");
});

test("version does not reply for private chat", () => {
    const replies = [];
    const ctx = {
        chat: { type: "private", id: 999 },
        reply: (text) => replies.push(text),
    };
    const bot = { command: (name, fn) => fn(ctx) };
    const versionModule = loadModule();
    versionModule(bot);
    expect(replies.length).toBe(0);
});
