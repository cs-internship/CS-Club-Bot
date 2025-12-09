jest.resetModules();

describe("groupHandler remaining fallback branches", () => {
    test("top-level handler logs error when ctx.reply also throws", async () => {
        jest.resetModules();
        const consoleError = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});

        jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
            groupMessageValidator: jest.fn().mockResolvedValue(true),
        }));

        jest.doMock("../../../../bot/services/perplexity", () => ({
            sendToPerplexity: jest.fn().mockRejectedValue(new Error("boom")),
        }));

        jest.doMock("../../../../bot/utils/formatGroupMessage", () => ({
            formatGroupMessage: (x) => x,
            formatGroupMessageChunks: undefined,
        }));

        jest.doMock("../../../../bot/utils/safeChunkText", () => ({
            safeChunkText: jest.fn((t) => [t]),
        }));

        jest.doMock("../../../../bot/config", () => ({
            ALLOWED_GROUPS: [7],
            ADMIN_USERNAME: "admin",
            TELEGRAM_BOT_TOKEN: "TOKEN",
        }));

        const message = { text: "oops", entities: [], message_id: 4209 };
        const ctx = {
            message,
            chat: { id: 7, type: "group" },
            from: { username: "user" },
            telegram: {
                getFile: async () => ({ file_path: "p" }),
                sendMessage: async () => ({ message_id: 999 }),
                editMessageText: async () => {
                    throw new Error("edit fail");
                },
                callApi: async () => {},
            },
            reply: async () => {
                throw new Error("reply fail");
            },
        };

        const bot = {
            on: (evt, fn) => {
                if (evt === "message") fn(ctx, () => {});
            },
        };

        const groupHandler = require("../../../../bot/handlers/messages/groupHandler");
        groupHandler(bot);
        await new Promise((r) => setImmediate(r));

        expect(consoleError).toHaveBeenCalled();
        consoleError.mockRestore();
    });

    test("_processMessage logs when fallback sendMessage throws after edit failure", async () => {
        jest.resetModules();
        const consoleError = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});

        jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
            groupMessageValidator: jest.fn().mockResolvedValue(true),
        }));

        jest.doMock("../../../../bot/services/perplexity", () => ({
            sendToPerplexity: jest.fn().mockRejectedValue(new Error("boom")),
        }));

        jest.doMock("../../../../bot/utils/escapeHtml", () => ({
            escapeHtml: (s) => s,
        }));
        jest.doMock("../../../../bot/config", () => ({
            TELEGRAM_BOT_TOKEN: "TOKEN",
        }));

        let callCount = 0;
        const telegramClient = {
            sendMessage: async () => {
                callCount++;
                if (callCount === 1) return { message_id: 8001 };
                throw new Error("send fail");
            },
            editMessageText: async () => {
                throw new Error("edit fail");
            },
        };

        const groupHandlerModule = require("../../../../bot/handlers/messages/groupHandler");
        const process = groupHandlerModule._processMessage;

        await process(telegramClient, "x", [], 100, 124, "group", {});

        expect(consoleError).toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
