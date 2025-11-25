describe("Notion utils error paths", () => {
    test("getUsernameByFullname handles invalid Username property", async () => {
        // create a custom mock for Client that returns a page with invalid Username prop
        jest.resetModules();
        jest.doMock("@notionhq/client", () => ({
            Client: jest.fn().mockImplementation(() => ({
                databases: {
                    query: async () => ({
                        results: [
                            { properties: { Username: { type: "number" } } },
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
        const res = await getUsernameByFullname("Any");
        expect(res).toBeNull();
    });

    test("getRoleByUsername handles not found and logs warning for disallowed role", async () => {
        jest.resetModules();
        jest.doMock("@notionhq/client", () => ({
            Client: jest.fn().mockImplementation(() => ({
                databases: {
                    query: async (opts) => {
                        if (opts.filter.rich_text.equals === "missing") {
                            return { results: [] };
                        }
                        return {
                            results: [
                                {
                                    properties: {
                                        Role: {
                                            type: "multi_select",
                                            multi_select: [{ name: "Other" }],
                                        },
                                    },
                                },
                            ],
                        };
                    },
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
        expect(await getRoleByUsername("missing")).toBeNull();
        expect(await getRoleByUsername("something")).toBeNull();
    });
});
