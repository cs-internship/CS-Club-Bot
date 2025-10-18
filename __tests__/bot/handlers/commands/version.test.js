jest.resetModules();

jest.doMock("../../../../package.json", () => ({ version: "1.2.3" }));
jest.doMock("../../../../bot/config", () => ({ ALLOWED_GROUPS: [999] }));

const versionModule = require("../../../../bot/handlers/commands/version");

test("version replies in group when allowed", () => {
    const replies = [];
    const ctx = {
        chat: { type: "group", id: 999 },
        reply: (text) => replies.push(text),
    };
    const bot = { command: (name, fn) => fn(ctx) };
    versionModule(bot);
    expect(replies[0]).toMatch(/Bot version: 1.2.3/);
});

test("version does not reply for private chat", () => {
    const replies = [];
    const ctx = {
        chat: { type: "private", id: 999 },
        reply: (text) => replies.push(text),
    };
    const bot = { command: (name, fn) => fn(ctx) };
    versionModule(bot);
    expect(replies.length).toBe(0);
});
