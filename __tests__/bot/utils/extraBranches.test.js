describe("Extra branches for utils to reach 100% coverage", () => {
    test("checkUserExists returns true when Notion query throws", async () => {
        jest.resetModules();
        jest.doMock("@notionhq/client", () => ({
            Client: jest.fn().mockImplementation(() => ({
                databases: {
                    query: async () => {
                        throw new Error("boom");
                    },
                },
            })),
        }));
        jest.doMock("../../../bot/config", () => ({
            NOTION_API_KEY: "x",
            NOTION_DATABASE_ID: "db",
        }));

        const {
            checkUserExists,
        } = require("../../../bot/utils/checkUserExists");
        const res = await checkUserExists(1);
        expect(res).toBe(true);
    });

    test("getRoleByUsername handles invalid Role property format", async () => {
        jest.resetModules();
        jest.doMock("@notionhq/client", () => ({
            Client: jest.fn().mockImplementation(() => ({
                databases: {
                    query: async () => ({
                        results: [{ properties: { Role: { type: "text" } } }],
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
        const res = await getRoleByUsername("u");
        expect(res).toBeNull();
    });

    test("checkUserBanned returns null when user not found and when query throws", async () => {
        jest.resetModules();
        // case: not found
        jest.doMock("@notionhq/client", () => ({
            Client: jest.fn().mockImplementation(() => ({
                databases: { query: async () => ({ results: [] }) },
            })),
        }));
        jest.doMock("../../../bot/config", () => ({
            NOTION_API_KEY: "x",
            NOTION_DATABASE_ID: "db",
        }));
        let { checkUserBanned } = require("../../../bot/utils/checkUserBanned");
        expect(await checkUserBanned("noone")).toBeNull();

        // case: query throws
        jest.resetModules();
        jest.doMock("@notionhq/client", () => ({
            Client: jest.fn().mockImplementation(() => ({
                databases: {
                    query: async () => {
                        throw new Error("fail");
                    },
                },
            })),
        }));
        jest.doMock("../../../bot/config", () => ({
            NOTION_API_KEY: "x",
            NOTION_DATABASE_ID: "db",
        }));
        ({ checkUserBanned } = require("../../../bot/utils/checkUserBanned"));
        expect(await checkUserBanned("someone")).toBeNull();
    });

    test("groupMessageValidator additional branches", async () => {
        jest.resetModules();
        jest.doMock("../../../bot/config", () => ({
            ALLOWED_GROUPS: [10],
            ADMIN_CHAT_ID: 999,
        }));
        const {
            groupMessageValidator,
        } = require("../../../bot/utils/groupMessageValidator");

        // #no_ai should return false
        expect(await groupMessageValidator("group", 10, "#no_ai", {})).toBe(
            false
        );

        // allowed group but without tags returns false
        expect(
            await groupMessageValidator("group", 10, "regular message", {})
        ).toBe(false);
    });
});
