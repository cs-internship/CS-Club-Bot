jest.resetModules();

const mainMenu = require("../../../../bot/handlers/scenes/mainMenu");

test("getMainMenuKeyboard returns expected structure", () => {
    const kb = mainMenu.getMainMenuKeyboard();
    expect(kb).toHaveProperty("keyboard");
    expect(Array.isArray(kb.keyboard)).toBe(true);
    expect(kb.input_field_placeholder).toMatch(/لطفاً یک گزینه/);
});

test("showMainMenu replies with keyboard", async () => {
    const replies = [];
    const ctx = { reply: async (t, opts) => replies.push({ t, opts }) };
    await mainMenu.showMainMenu(ctx);
    expect(replies.length).toBe(1);
    expect(replies[0].opts.reply_markup).toHaveProperty("keyboard");
});
