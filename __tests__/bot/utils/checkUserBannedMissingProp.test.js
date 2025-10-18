jest.resetModules();
jest.doMock("@notionhq/client", () => ({
    Client: jest.fn().mockImplementation(() => ({
        databases: { query: async () => ({ results: [{ properties: {} }] }) },
    })),
}));
jest.doMock("../../../bot/config", () => ({
    NOTION_API_KEY: "x",
    NOTION_DATABASE_ID: "db",
}));

const { checkUserBanned } = require("../../../bot/utils/checkUserBanned");

test("checkUserBanned returns null when isBanned prop missing", async () => {
    expect(await checkUserBanned("user")).toBeNull();
});
