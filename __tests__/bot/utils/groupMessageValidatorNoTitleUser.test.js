jest.resetModules();
jest.doMock("../../../bot/config", () => ({
    ALLOWED_GROUPS: [1],
    ADMIN_CHAT_ID: 555,
}));

test("groupMessageValidator handles missing chat title and username", async () => {
    const sent = [];
    const mockCtx = {
        chat: {},
        from: {},
        telegram: { sendMessage: async (id, text) => sent.push({ id, text }) },
    };
    const {
        groupMessageValidator,
    } = require("../../../bot/utils/groupMessageValidator");
    const res = await groupMessageValidator("group", 2222, "hi", mockCtx);
    expect(res).toBe(false);
    expect(sent[0].text).toContain("Chat Title: N/A");
    expect(sent[0].text).toContain("Username: @N/A");
});
