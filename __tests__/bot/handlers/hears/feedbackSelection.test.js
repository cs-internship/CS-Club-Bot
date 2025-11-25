jest.resetModules();

// Mock Notion client and getRoleByUsername
const mockQuery = jest.fn();
jest.doMock("@notionhq/client", () => ({
    Client: function () {
        return { databases: { query: mockQuery } };
    },
}));
jest.doMock("../../../../bot/utils/getRoleByUsername", () => ({
    getRoleByUsername: jest.fn(),
}));

const {
    getRoleByUsername,
} = require("../../../../bot/utils/getRoleByUsername");

describe("feedbackSelection handler", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test("shows list and deletes loading message on success", async () => {
        mockQuery.mockResolvedValue({
            results: [
                {
                    properties: {
                        "Full Name": {
                            title: [{ text: { content: "Alice" } }],
                        },
                        isHidden: { checkbox: false },
                        Role: { multi_select: [{ name: "Student" }] },
                    },
                },
                {
                    properties: {
                        "Full Name": { title: [{ text: { content: "Bob" } }] },
                        isHidden: { checkbox: true },
                        Role: { multi_select: [{ name: "Student" }] },
                    },
                },
            ],
        });
        getRoleByUsername.mockResolvedValue("Student");

        const replies = [];
        const ctx = {
            reply: async (text, opts) => {
                const msg = { text, opts };
                // simulate that first reply returns message_id
                if (text.includes("در حال دریافت")) {
                    return { message_id: 99 };
                }
                replies.push(msg);
                return null;
            },
            deleteMessage: async (id) => {
                if (id !== 99) throw new Error("bad id");
            },
            session: {},
            from: { username: "u" },
        };

        const bot = { hears: (msg, fn) => fn(ctx) };
        const module = require("../../../../bot/handlers/hears/feedbackSelection");
        module(bot);
        await new Promise((r) => setImmediate(r));

        expect(ctx.session.availableUsers).toBeDefined();
        expect(ctx.session.step).toBe("awaiting_user_selection");
        // last reply should be the prompt with keyboard
        expect(replies[replies.length - 1].text).toMatch(/لطفاً یک همیار فنی/);
    });

    test("handles missing role", async () => {
        mockQuery.mockResolvedValue({ results: [] });
        getRoleByUsername.mockResolvedValue(null);

        const replies = [];
        const ctx = {
            reply: async (text) => replies.push(text),
            session: {},
            from: { username: "u" },
        };
        const bot = { hears: (msg, fn) => fn(ctx) };
        const module = require("../../../../bot/handlers/hears/feedbackSelection");
        module(bot);
        await new Promise((r) => setImmediate(r));
        expect(replies.some((r) => r.includes("خطا در دریافت دوره"))).toBe(
            true
        );
    });

    test("handles no users found", async () => {
        mockQuery.mockResolvedValue({ results: [] });
        getRoleByUsername.mockResolvedValue("Anything");

        const replies = [];
        const ctx = {
            reply: async (text) => replies.push(text),
            session: {},
            from: { username: "u" },
        };
        const bot = { hears: (msg, fn) => fn(ctx) };
        const module = require("../../../../bot/handlers/hears/feedbackSelection");
        module(bot);
        await new Promise((r) => setImmediate(r));
        expect(
            replies.some((r) => r.includes("هنوز هیچ کاربری ثبت نشده"))
        ).toBe(true);
    });

    test("handles Notion query throwing", async () => {
        mockQuery.mockRejectedValue(new Error("notion down"));
        console.error = jest.fn();
        const replies = [];
        const ctx = {
            reply: async (text) => replies.push(text),
            session: {},
            from: { username: "u" },
        };
        const bot = { hears: (msg, fn) => fn(ctx) };
        const module = require("../../../../bot/handlers/hears/feedbackSelection");
        module(bot);
        await new Promise((r) => setImmediate(r));
        expect(console.error).toHaveBeenCalled();
        expect(replies.some((r) => r.includes("مشکلی در دریافت اطلاعات"))).toBe(
            true
        );
    });

    test("continues when deleteMessage throws (warns)", async () => {
        mockQuery.mockResolvedValue({
            results: [
                {
                    properties: {
                        "Full Name": {
                            title: [{ text: { content: "Alice" } }],
                        },
                        isHidden: { checkbox: false },
                        Role: { multi_select: [{ name: "Student" }] },
                    },
                },
            ],
        });
        getRoleByUsername.mockResolvedValue("Student");
        console.warn = jest.fn();

        const ctx = {
            reply: async (text) => {
                if (text.includes("در حال دریافت")) {
                    return { message_id: 100 };
                }
                return null;
            },
            deleteMessage: async (_id) => {
                throw new Error("cannot delete");
            },
            session: {},
            from: { username: "u" },
        };
        const bot = { hears: (msg, fn) => fn(ctx) };
        const module = require("../../../../bot/handlers/hears/feedbackSelection");
        module(bot);
        await new Promise((r) => setImmediate(r));
        expect(console.warn).toHaveBeenCalled();
    });
});
