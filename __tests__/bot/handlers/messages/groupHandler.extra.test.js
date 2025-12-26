jest.resetModules();

const mockFetchSuccess = () =>
    jest.doMock("node-fetch", () =>
        jest.fn(async () => ({
            ok: true,
            buffer: async () => Buffer.from("imgdata"),
        }))
    );

mockFetchSuccess();

describe("groupHandler additional edge branches", () => {
    test("buildChunks uses formatGroupMessageChunks when available", async () => {
        jest.resetModules();
        const mockFormatChunks = jest.fn().mockReturnValue(["chunked"]);

        jest.doMock("../../../../bot/utils/formatGroupMessage", () => ({
            formatGroupMessage: (x) => `FMT:${x}`,
            formatGroupMessageChunks: mockFormatChunks,
        }));

        jest.doMock("../../../../bot/utils/safeChunkText", () => ({
            safeChunkText: jest.fn(() => ["fallback"]),
        }));

        jest.doMock("../../../../bot/services/perplexity", () => ({
            sendToPerplexity: jest.fn().mockResolvedValue("resp"),
        }));

        jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
            groupMessageValidator: jest.fn().mockResolvedValue(true),
        }));

        jest.doMock("../../../../bot/config", () => ({
            ALLOWED_GROUPS: [1],
            ADMIN_USERNAME: "admin",
            TELEGRAM_BOT_TOKEN: "TOKEN",
        }));

        const {
            sendToPerplexity,
        } = require("../../../../bot/services/perplexity");
        const groupHandler = require("../../../../bot/handlers/messages/groupHandler");

        const ctx = {
            message: { text: "hi", entities: [], message_id: 1 },
            chat: { id: 1, type: "group" },
            from: { username: "user" },
            telegram: {
                sendMessage: async () => ({ message_id: 10 }),
                editMessageText: async (c, mid, u, text) => {
                    // eslint-disable-next-line no-unused-vars
                    const editedText = text;
                },
                callApi: async () => {},
                getFile: async () => ({ file_path: "p" }),
            },
            reply: async () => {},
        };

        const bot = {
            on: (evt, fn) => {
                if (evt === "message") fn(ctx, () => {});
            },
        };
        groupHandler(bot);
        await new Promise((r) => setImmediate(r));

        // formatGroupMessageChunks should have been used (called)
        expect(mockFormatChunks).toHaveBeenCalled();
        expect(sendToPerplexity).toHaveBeenCalledWith("hi", []);
    });

    test("media_group setTimeout catch logs error when processMessage throws", async () => {
        jest.resetModules();
        mockFetchSuccess();

        const consoleSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});

        // make groupMessageValidator throw so processMessage rejects synchronously
        jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
            groupMessageValidator: jest
                .fn()
                .mockRejectedValue(new Error("boom")),
        }));

        jest.doMock("../../../../bot/services/perplexity", () => ({
            sendToPerplexity: jest.fn(),
        }));

        jest.doMock("../../../../bot/utils/formatGroupMessage", () => ({
            formatGroupMessage: (x) => x,
            formatGroupMessageChunks: undefined,
        }));

        jest.doMock("../../../../bot/utils/safeChunkText", () => ({
            safeChunkText: jest.fn((t) => [t]),
        }));

        jest.doMock("../../../../bot/config", () => ({
            ALLOWED_GROUPS: [50],
            ADMIN_USERNAME: "admin",
            TELEGRAM_BOT_TOKEN: "TOKEN",
        }));

        const groupHandler = require("../../../../bot/handlers/messages/groupHandler");

        const message1 = {
            media_group_id: "mgx",
            chatId: 50,
            chatType: "group",
            text: "part1",
            message_id: 2000,
        };
        const message2 = {
            media_group_id: "mgx",
            chatId: 50,
            chatType: "group",
            photo: [{ file_id: "p1" }],
            caption: "cap",
            message_id: 2001,
        };

        const ctx1 = {
            message: message1,
            chat: { id: 50, type: "group" },
            from: { username: "user" },
            telegram: {
                getFile: async () => ({ file_path: "p" }),
                sendMessage: async () => ({ message_id: 9999 }),
                editMessageText: async () => {},
                callApi: async () => {},
            },
            reply: async () => {},
        };
        const ctx2 = { ...ctx1, message: message2 };

        const bot = {
            on: (evt, fn) => {
                if (evt === "message") {
                    fn(ctx1, () => {});
                    fn(ctx2, () => {});
                }
            },
        };
        groupHandler(bot);

        // wait for timeout to fire
        await new Promise((r) => setTimeout(r, 800));
        await new Promise((r) => setImmediate(r));

        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining("❌ Error processing media group:"),
            expect.anything()
        );

        consoleSpy.mockRestore();
    });

    test("top-level errorEntry path calls editMessageText", async () => {
        jest.resetModules();

        jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
            groupMessageValidator: jest.fn().mockResolvedValue(true),
        }));

        const {
            ERROR_RESPONSES,
        } = require("../../../../bot/constants/errorResponses");

        jest.doMock("../../../../bot/services/perplexity", () => ({
            sendToPerplexity: jest
                .fn()
                .mockResolvedValue(ERROR_RESPONSES.UNKNOWN.code),
        }));

        let edited = false;
        const ctx = {
            message: { text: "err", entities: [], message_id: 4000 },
            chat: { id: 2, type: "group" },
            from: { username: "user" },
            telegram: {
                getFile: async () => ({ file_path: "p" }),
                sendMessage: async () => ({ message_id: 1111 }),
                editMessageText: async () => {
                    edited = true;
                },
                callApi: async () => {},
            },
            reply: async () => {},
        };

        jest.doMock("../../../../bot/config", () => ({
            ALLOWED_GROUPS: [2],
            ADMIN_USERNAME: "admin",
            TELEGRAM_BOT_TOKEN: "TOKEN",
        }));

        const bot = {
            on: (evt, fn) => {
                if (evt === "message") fn(ctx, () => {});
            },
        };

        const groupHandler = require("../../../../bot/handlers/messages/groupHandler");
        groupHandler(bot);
        await new Promise((r) => setImmediate(r));

        expect(edited).toBe(true);
    });
});
