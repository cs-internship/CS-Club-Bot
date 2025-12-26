describe("Branch coverage extra edge cases", () => {
    test("safeChunkText empty returns empty array", () => {
        const { safeChunkText } = require("../../../bot/utils/safeChunkText");
        expect(safeChunkText("")).toEqual([]);
    });

    test("getUsernameByFullname empty rich_text returns null", async () => {
        jest.resetModules();
        jest.doMock("@notionhq/client", () => ({
            Client: jest.fn().mockImplementation(() => ({
                databases: {
                    query: async () => ({
                        results: [
                            {
                                properties: {
                                    Username: {
                                        type: "rich_text",
                                        rich_text: [],
                                    },
                                },
                            },
                        ],
                    }),
                },
            })),
        }));
        jest.doMock("../../../bot/config", () => ({
            NOTION_API_KEY: "x",
            NOTION_DATABASE_ID: "db",
        }));
        const {
            getUsernameByFullname,
        } = require("../../../bot/utils/getUsernameByFullname");
        expect(await getUsernameByFullname("X")).toBeNull();
    });

    test("getRoleByUsername empty multi_select returns null", async () => {
        jest.resetModules();
        jest.doMock("@notionhq/client", () => ({
            Client: jest.fn().mockImplementation(() => ({
                databases: {
                    query: async () => ({
                        results: [
                            {
                                properties: {
                                    Role: {
                                        type: "multi_select",
                                        multi_select: [],
                                    },
                                },
                            },
                        ],
                    }),
                },
            })),
        }));
        jest.doMock("../../../bot/config", () => ({
            NOTION_API_KEY: "x",
            NOTION_DATABASE_ID: "db",
        }));
        const {
            getRoleByUsername,
        } = require("../../../bot/utils/getRoleByUsername");
        expect(await getRoleByUsername("X")).toBeNull();
    });

    test("groupMessageValidator unauthorized with no text shows <i>No text content</i>", async () => {
        jest.resetModules();
        jest.doMock("../../../bot/config", () => ({
            ALLOWED_GROUPS: [1],
            ADMIN_CHAT_ID: 999,
        }));
        const sent = [];
        const mockCtx = {
            chat: { title: "T" },
            from: { id: 2, username: "u" },
            telegram: {
                sendMessage: async (id, text) => sent.push({ id, text }),
            },
        };
        const {
            groupMessageValidator,
        } = require("../../../bot/utils/groupMessageValidator");
        const res = await groupMessageValidator("group", 222, null, mockCtx);
        expect(res).toBe(false);
        expect(sent[0].text).toContain("<i>No text content</i>");
    });
});
