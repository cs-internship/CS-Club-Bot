jest.resetModules();

const groupIdModule = require("../../../../bot/handlers/commands/groupId");

test("group_id replies with chat id and remove keyboard", () => {
    const replies = [];
    const ctx = {
        chat: { id: 123 },
        reply: (text, opts) => replies.push({ text, opts }),
    };
    const bot = { command: (name, fn) => fn(ctx) };
    groupIdModule(bot);
    expect(replies.length).toBe(1);
    expect(replies[0].text).toMatch(/Group ID: 123/);
    expect(replies[0].opts).toHaveProperty("reply_markup");
});
