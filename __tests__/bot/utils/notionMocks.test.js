// Mock the Notion client used across utils
jest.mock("@notionhq/client", () => {
    return {
        Client: jest.fn().mockImplementation(() => ({
            databases: {
                query: jest.fn(async (opts) => {
                    // simple routing by filter property
                    const prop = opts.filter.property;
                    if (prop === "Telegram ID") {
                        return {
                            results:
                                opts.filter.number.equals === 42
                                    ? [{ id: 1 }]
                                    : [],
                        };
                    }
                    if (prop === "Username") {
                        if (opts.filter.rich_text.equals === "banned_user") {
                            return {
                                results: [
                                    {
                                        properties: {
                                            isBanned: { checkbox: true },
                                        },
                                    },
                                ],
                            };
                        }
                        if (opts.filter.rich_text.equals === "exists_user") {
                            return {
                                results: [
                                    {
                                        properties: {
                                            isBanned: { checkbox: false },
                                        },
                                    },
                                ],
                            };
                        }
                        if (opts.filter.rich_text.equals === "withrole") {
                            return {
                                results: [
                                    {
                                        properties: {
                                            Role: {
                                                type: "multi_select",
                                                multi_select: [{ name: "Web" }],
                                            },
                                        },
                                    },
                                ],
                            };
                        }
                        if (opts.filter.rich_text.equals === "norole") {
                            return {
                                results: [
                                    {
                                        properties: {
                                            Role: {
                                                type: "multi_select",
                                                multi_select: [
                                                    { name: "Other" },
                                                ],
                                            },
                                        },
                                    },
                                ],
                            };
                        }
                        return { results: [] };
                    }
                    if (prop === "Full Name") {
                        if (opts.filter.rich_text.equals === "John Doe") {
                            return {
                                results: [
                                    {
                                        properties: {
                                            Username: {
                                                type: "rich_text",
                                                rich_text: [
                                                    { plain_text: "jdoe" },
                                                ],
                                            },
                                        },
                                    },
                                ],
                            };
                        }
                        return { results: [] };
                    }
                    return { results: [] };
                }),
            },
        })),
    };
});

// Mock config to avoid environment errors
jest.mock("../../../bot/config", () => ({
    NOTION_API_KEY: "dummy",
    NOTION_DATABASE_ID: "db",
    ALLOWED_GROUPS: [111, 222],
    ADMIN_CHAT_ID: 999,
}));

const { checkUserExists } = require("../../../bot/utils/checkUserExists");
const { checkUserBanned } = require("../../../bot/utils/checkUserBanned");
const {
    getUsernameByFullname,
} = require("../../../bot/utils/getUsernameByFullname");
const { getRoleByUsername } = require("../../../bot/utils/getRoleByUsername");

describe("Notion-related utils", () => {
    test("checkUserExists returns true when user found", async () => {
        expect(await checkUserExists(42)).toBe(true);
    });

    test("checkUserExists returns false when not found", async () => {
        expect(await checkUserExists(100)).toBe(false);
    });

    test("checkUserBanned returns null for invalid username", async () => {
        expect(await checkUserBanned("")).toBeNull();
    });

    test("checkUserBanned returns true for banned_user", async () => {
        expect(await checkUserBanned("banned_user")).toBe(true);
    });

    test("checkUserBanned returns false for exists_user", async () => {
        expect(await checkUserBanned("exists_user")).toBe(false);
    });

    test("getUsernameByFullname returns username when found", async () => {
        expect(await getUsernameByFullname("John Doe")).toBe("jdoe");
    });

    test("getUsernameByFullname returns null when not found", async () => {
        expect(await getUsernameByFullname("Someone")).toBeNull();
    });

    test("getRoleByUsername returns role when allowed", async () => {
        expect(await getRoleByUsername("withrole")).toBe("Web");
    });

    test("getRoleByUsername returns null when role not allowed", async () => {
        expect(await getRoleByUsername("norole")).toBeNull();
    });
});
