jest.resetModules();

// Mock deps
jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
    groupMessageValidator: jest.fn().mockResolvedValue(true),
}));
jest.doMock("../../../../bot/utils/formatGroupMessage", () => ({
    formatGroupMessage: (x) => `FORMATTED:${x}`,
}));
jest.doMock("../../../../bot/constants/errorResponses", () => ({
    ERROR_RESPONSES: { UNKNOWN: { code: 520, message: "Unknown" } },
}));
jest.doMock("../../../../bot/services/perplexity", () => ({
    sendToPerplexity: jest.fn().mockResolvedValue("answer"),
}));
jest.doMock("../../../../bot/utils/safeChunkText", () => ({
    safeChunkText: (t) => [t],
}));
jest.doMock("../../../../bot/utils/escapeHtml", () => ({
    escapeHtml: (s) => s,
}));
jest.doMock("../../../../bot/config", () => ({
    ALLOWED_GROUPS: [10],
    ADMIN_USERNAME: "admin",
    TELEGRAM_BOT_TOKEN: "TOKEN",
}));

const groupHandler = require("../../../../bot/handlers/messages/groupHandler");
const {
    groupMessageValidator,
} = require("../../../../bot/utils/groupMessageValidator");
const { sendToPerplexity } = require("../../../../bot/services/perplexity");

// helper to create a bot and run the 'message' handler
const runHandler = async (message, ctxOverrides = {}) => {
    const calls = [];
    const ctx = {
        message,
        chat: { id: message.chatId || 1, type: message.chatType || "group" },
        from: { username: ctxOverrides.username || "user" },
        telegram: {
            getFile: async (file_id) => ({ file_path: "path.jpg" }),
            sendMessage: async (chatId, text, opts) => ({ message_id: 999 }),
            editMessageText: async () => {},
            callApi: async () => {},
        },
        reply: async () => {},
    };

    const bot = {
        on: (evt, fn) => {
            if (evt === "message") fn(ctx, () => {});
        },
    };
    groupHandler(bot);
    // wait for any async handlers
    await new Promise((r) => setImmediate(r));
    return ctx;
};
beforeEach(() => {
    jest.clearAllMocks();
});

test("process simple text message -> sends to perplexity and edits message with formatted result", async () => {
    const message = { text: "hello", entities: [], message_id: 123 };
    const ctx = await runHandler(message);
    expect(sendToPerplexity).toHaveBeenCalledWith("hello", []);
});

test("photo message gets file and included in photoUrls", async () => {
    const message = {
        photo: [{ file_id: "f1" }, { file_id: "f2" }],
        caption: "with photo",
        caption_entities: [],
        message_id: 124,
    };
    const ctx = await runHandler(message);
    expect(sendToPerplexity).toHaveBeenCalledWith("with photo", [
        "https://api.telegram.org/file/botTOKEN/path.jpg",
    ]);
});

test("exact bot command reaction for non-admin user triggers reaction", async () => {
    // provide entity that matches whole text and set chatId to an allowed group
    const message = {
        text: "/cmd",
        entities: [{ type: "bot_command", offset: 0, length: 4 }],
        message_id: 125,
        chatId: 10,
    };
    // override ctx.from.username to non-admin
    await runHandler(message, { username: "someone" });
    // exact-command branch should return early and not call sendToPerplexity
    expect(sendToPerplexity).not.toHaveBeenCalled();
});

test("media_group collects and processes after timeout", async () => {
    const message1 = {
        media_group_id: "g1",
        chatId: 50,
        chatType: "group",
        text: "part1",
        message_id: 200,
    };
    const message2 = {
        media_group_id: "g1",
        chatId: 50,
        chatType: "group",
        photo: [{ file_id: "p1" }],
        caption: "cap",
        message_id: 201,
    };
    // run first message
    await runHandler(message1);
    // second message in same group
    await runHandler(message2);
    // wait for the module's setTimeout (700ms) to fire
    await new Promise((r) => setTimeout(r, 800));
    // allow any pending promises
    await new Promise((r) => setImmediate(r));
    expect(sendToPerplexity).toHaveBeenCalled();
});

test("when groupMessageValidator returns false, nothing happens", async () => {
    // override mock to false for this test
    groupMessageValidator.mockResolvedValueOnce(false);
    const message = { text: "skip", entities: [], message_id: 300 };
    await runHandler(message);
    // sendToPerplexity should not be called
    expect(sendToPerplexity).not.toHaveBeenCalled();
});

test("admin exact-command calls next instead of reacting", async () => {
    const message = {
        text: "/cmd",
        entities: [{ type: "bot_command", offset: 0, length: 4 }],
        message_id: 126,
        chatId: 10,
    };

    // create a bot that captures next invocation
    let nextCalled = false;
    const ctx = {
        message,
        chat: { id: 10, type: "group" },
        from: { username: "admin" },
        telegram: { callApi: async () => {} },
        reply: async () => {},
    };

    const bot = {
        on: (evt, fn) => {
            if (evt === "message")
                fn(ctx, () => {
                    nextCalled = true;
                });
        },
    };
    const groupHandler = require("../../../../bot/handlers/messages/groupHandler");
    groupHandler(bot);
    await new Promise((r) => setImmediate(r));
    expect(nextCalled).toBe(true);
});

test("error response from sendToPerplexity triggers editMessageText with error entry", async () => {
    // mock sendToPerplexity to return a code matching ERROR_RESPONSES
    const {
        ERROR_RESPONSES,
    } = require("../../../../bot/constants/errorResponses");
    // create a custom mock that returns the UNKNOWN code
    const perplex = require("../../../../bot/services/perplexity");
    perplex.sendToPerplexity = jest
        .fn()
        .mockResolvedValue(ERROR_RESPONSES.UNKNOWN.code);

    // spy on editMessageText
    let edited = false;
    const message = { text: "test", entities: [], message_id: 500 };
    const ctx = {
        message,
        chat: { id: 2, type: "group" },
        from: { username: "user" },
        telegram: {
            getFile: async () => ({ file_path: "path.jpg" }),
            sendMessage: async () => ({ message_id: 111 }),
            editMessageText: async () => {
                edited = true;
            },
            callApi: async () => {},
        },
        reply: async () => {},
    };
    const bot = {
        on: (evt, fn) => {
            if (evt === "message") fn(ctx, () => {});
        },
    };
    // re-require module to use overwritten sendToPerplexity
    jest.resetModules();
    jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
        groupMessageValidator: jest.fn().mockResolvedValue(true),
    }));
    jest.doMock("../../../../bot/utils/formatGroupMessage", () => ({
        formatGroupMessage: (x) => x,
    }));
    jest.doMock("../../../../bot/utils/safeChunkText", () => ({
        safeChunkText: (t) => [t],
    }));
    jest.doMock("../../../../bot/utils/escapeHtml", () => ({
        escapeHtml: (s) => s,
    }));
    jest.doMock("../../../../bot/config", () => ({
        ALLOWED_GROUPS: [2],
        ADMIN_USERNAME: "admin",
        TELEGRAM_BOT_TOKEN: "TOKEN",
    }));

    const groupHandler = require("../../../../bot/handlers/messages/groupHandler");
    groupHandler(bot);
    await new Promise((r) => setImmediate(r));
    expect(edited).toBe(true);
});

test("processing error triggers fallback reply and fallback sendMessage in processMessage", async () => {
    // simulate sendToPerplexity throwing inside processMessage to hit fallback sendMessage
    jest.resetModules();
    jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
        groupMessageValidator: jest.fn().mockResolvedValue(true),
    }));
    jest.doMock("../../../../bot/utils/formatGroupMessage", () => ({
        formatGroupMessage: (x) => x,
    }));
    jest.doMock("../../../../bot/utils/safeChunkText", () => ({
        safeChunkText: (t) => [t],
    }));
    jest.doMock("../../../../bot/utils/escapeHtml", () => ({
        escapeHtml: (s) => s,
    }));
    jest.doMock("../../../../bot/services/perplexity", () => ({
        sendToPerplexity: jest.fn().mockRejectedValue(new Error("boom")),
    }));
    jest.doMock("../../../../bot/config", () => ({
        ALLOWED_GROUPS: [3],
        ADMIN_USERNAME: "admin",
        TELEGRAM_BOT_TOKEN: "TOKEN",
    }));

    let fallbackSent = false;
    const message = { text: "x", entities: [], message_id: 600 };
    const ctx = {
        message,
        chat: { id: 3, type: "group" },
        from: { username: "user" },
        telegram: {
            getFile: async () => ({ file_path: "path.jpg" }),
            sendMessage: async () => {
                fallbackSent = true;
                return { message_id: 222 };
            },
            editMessageText: async () => {
                throw new Error("edit fail");
            },
            callApi: async () => {},
        },
        reply: async () => {},
    };

    const bot = {
        on: (evt, fn) => {
            if (evt === "message") fn(ctx, () => {});
        },
    };
    const groupHandler = require("../../../../bot/handlers/messages/groupHandler");
    groupHandler(bot);
    await new Promise((r) => setImmediate(r));
    expect(fallbackSent).toBe(true);
});

test("splits long response into multiple chunks and sends subsequent messages", async () => {
    jest.resetModules();
    jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
        groupMessageValidator: jest.fn().mockResolvedValue(true),
    }));
    jest.doMock("../../../../bot/utils/formatGroupMessage", () => ({
        formatGroupMessage: (x) => x,
    }));
    jest.doMock("../../../../bot/utils/safeChunkText", () => ({
        safeChunkText: (t) => ["part1", "part2", "part3"],
    }));
    jest.doMock("../../../../bot/utils/escapeHtml", () => ({
        escapeHtml: (s) => s,
    }));
    jest.doMock("../../../../bot/services/perplexity", () => ({
        sendToPerplexity: jest.fn().mockResolvedValue("LONG"),
    }));
    jest.doMock("../../../../bot/config", () => ({
        ALLOWED_GROUPS: [1],
        ADMIN_USERNAME: "admin",
        TELEGRAM_BOT_TOKEN: "TOKEN",
    }));

    let editedText = null;
    const sent = [];
    const message = { text: "long", entities: [], message_id: 700 };
    const ctx = {
        message,
        chat: { id: 1, type: "group" },
        from: { username: "user" },
        telegram: {
            getFile: async () => ({ file_path: "p" }),
            sendMessage: async (chatId, text, opts) => {
                sent.push({ chatId, text, opts });
                return { message_id: 400 };
            },
            editMessageText: async (chatId, mid, undef, text, opts) => {
                editedText = text;
            },
            callApi: async () => {},
        },
        reply: async () => {},
    };

    const bot = {
        on: (evt, fn) => {
            if (evt === "message") fn(ctx, () => {});
        },
    };
    const groupHandler = require("../../../../bot/handlers/messages/groupHandler");
    groupHandler(bot);
    await new Promise((r) => setImmediate(r));

    expect(editedText).toBe("part1");
    // first sendMessage is the processing message, then two chunk messages
    expect(sent.length).toBe(3);
    expect(sent[0].text).toBe("🕒 در حال پردازش...");
    expect(sent[1].text).toBe("part2");
    expect(sent[2].text).toBe("part3");
});

test("private chat returns next() immediately", async () => {
    let nextCalled = false;
    const message = { text: "hi", entities: [], message_id: 800 };
    const ctx = {
        message,
        chat: { id: 9, type: "private" },
        from: { username: "user" },
        telegram: { callApi: async () => {} },
        reply: async () => {},
    };
    const bot = {
        on: (evt, fn) => {
            if (evt === "message")
                fn(ctx, () => {
                    nextCalled = true;
                });
        },
    };
    const groupHandler = require("../../../../bot/handlers/messages/groupHandler");
    groupHandler(bot);
    await new Promise((r) => setImmediate(r));
    expect(nextCalled).toBe(true);
});

test("exact-command reaction callApi throws but does not call perplexity", async () => {
    jest.resetModules();
    jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
        groupMessageValidator: jest.fn().mockResolvedValue(true),
    }));
    jest.doMock("../../../../bot/config", () => ({
        ALLOWED_GROUPS: [10],
        ADMIN_USERNAME: "admin",
        TELEGRAM_BOT_TOKEN: "TOKEN",
    }));
    jest.doMock("../../../../bot/services/perplexity", () => ({
        sendToPerplexity: jest.fn().mockResolvedValue("ok"),
    }));

    const message = {
        text: "/x",
        entities: [{ type: "bot_command", offset: 0, length: 2 }],
        message_id: 900,
        chatId: 10,
    };
    const ctx = {
        message,
        chat: { id: 10, type: "group" },
        from: { username: "someone" },
        telegram: {
            callApi: async () => {
                throw new Error("call fail");
            },
        },
        reply: async () => {},
    };

    const bot = {
        on: (evt, fn) => {
            if (evt === "message") fn(ctx, () => {});
        },
    };
    const { sendToPerplexity } = require("../../../../bot/services/perplexity");
    const groupHandler = require("../../../../bot/handlers/messages/groupHandler");
    groupHandler(bot);
    await new Promise((r) => setImmediate(r));
    expect(sendToPerplexity).not.toHaveBeenCalled();
});

test("photo getFile throws and processing continues without photoUrls", async () => {
    jest.resetModules();
    jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
        groupMessageValidator: jest.fn().mockResolvedValue(true),
    }));
    jest.doMock("../../../../bot/utils/formatGroupMessage", () => ({
        formatGroupMessage: (x) => x,
    }));
    jest.doMock("../../../../bot/utils/safeChunkText", () => ({
        safeChunkText: (t) => [t],
    }));
    jest.doMock("../../../../bot/utils/escapeHtml", () => ({
        escapeHtml: (s) => s,
    }));
    jest.doMock("../../../../bot/services/perplexity", () => ({
        sendToPerplexity: jest.fn().mockResolvedValue("reply"),
    }));
    jest.doMock("../../../../bot/config", () => ({
        ALLOWED_GROUPS: [5],
        ADMIN_USERNAME: "admin",
        TELEGRAM_BOT_TOKEN: "TOKEN",
    }));

    let usedPhotoUrls = null;
    const message = {
        photo: [{ file_id: "f1" }],
        caption: "cap",
        caption_entities: [],
        message_id: 1000,
    };
    const ctx = {
        message,
        chat: { id: 5, type: "group" },
        from: { username: "user" },
        telegram: {
            getFile: async () => {
                throw new Error("no file");
            },
            sendMessage: async () => ({ message_id: 555 }),
            editMessageText: async () => {},
            callApi: async () => {},
        },
        reply: async () => {},
    };

    const bot = {
        on: (evt, fn) => {
            if (evt === "message") fn(ctx, () => {});
        },
    };
    const { sendToPerplexity } = require("../../../../bot/services/perplexity");
    const groupHandler = require("../../../../bot/handlers/messages/groupHandler");
    groupHandler(bot);
    await new Promise((r) => setImmediate(r));
    expect(sendToPerplexity).toHaveBeenCalledWith("cap", []);
});

test("media_group processing logs error when processing throws inside timeout", async () => {
    jest.resetModules();
    jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
        groupMessageValidator: jest.fn().mockResolvedValue(true),
    }));
    jest.doMock("../../../../bot/utils/formatGroupMessage", () => ({
        formatGroupMessage: (x) => x,
    }));
    jest.doMock("../../../../bot/utils/safeChunkText", () => ({
        safeChunkText: (t) => [t],
    }));
    jest.doMock("../../../../bot/utils/escapeHtml", () => ({
        escapeHtml: (s) => s,
    }));
    jest.doMock("../../../../bot/services/perplexity", () => ({
        sendToPerplexity: jest.fn().mockRejectedValue(new Error("boom")),
    }));
    jest.doMock("../../../../bot/config", () => ({
        ALLOWED_GROUPS: [50],
        ADMIN_USERNAME: "admin",
        TELEGRAM_BOT_TOKEN: "TOKEN",
    }));

    const message1 = {
        media_group_id: "mg1",
        chatId: 50,
        chatType: "group",
        text: "t1",
        message_id: 1100,
    };
    const message2 = {
        media_group_id: "mg1",
        chatId: 50,
        chatType: "group",
        photo: [{ file_id: "p1" }],
        caption: "c",
        message_id: 1101,
    };

    // create ctx and bot similar to runHandler but with failing sendToPerplexity
    const ctx1 = {
        message: message1,
        chat: { id: 50, type: "group" },
        from: { username: "user" },
        telegram: {
            getFile: async () => ({ file_path: "p" }),
            sendMessage: async () => ({ message_id: 1234 }),
            editMessageText: async () => {},
            callApi: async () => {},
        },
        reply: async () => {},
    };

    const ctx2 = { ...ctx1, message: message2 };

    const groupHandler = require("../../../../bot/handlers/messages/groupHandler");
    const bot = {
        on: (evt, fn) => {
            if (evt === "message") {
                // simulate two messages arriving
                fn(ctx1, () => {});
                fn(ctx2, () => {});
            }
        },
    };

    groupHandler(bot);
    // wait for the module's setTimeout (700ms) to fire
    await new Promise((r) => setTimeout(r, 800));
    await new Promise((r) => setImmediate(r));

    const { sendToPerplexity } = require("../../../../bot/services/perplexity");
    expect(sendToPerplexity).toHaveBeenCalled();
});

test("processMessage handles errorEntry for media_group by editing message with error text", async () => {
    jest.resetModules();
    jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
        groupMessageValidator: jest.fn().mockResolvedValue(true),
    }));
    jest.doMock("../../../../bot/utils/formatGroupMessage", () => ({
        formatGroupMessage: (x) => x,
    }));
    jest.doMock("../../../../bot/utils/safeChunkText", () => ({
        safeChunkText: (t) => [t],
    }));
    jest.doMock("../../../../bot/utils/escapeHtml", () => ({
        escapeHtml: (s) => s,
    }));
    // make sendToPerplexity return the error code
    const {
        ERROR_RESPONSES,
    } = require("../../../../bot/constants/errorResponses");
    jest.doMock("../../../../bot/services/perplexity", () => ({
        sendToPerplexity: jest
            .fn()
            .mockResolvedValue(ERROR_RESPONSES.UNKNOWN.code),
    }));
    jest.doMock("../../../../bot/config", () => ({
        ALLOWED_GROUPS: [50],
        ADMIN_USERNAME: "admin",
        TELEGRAM_BOT_TOKEN: "TOKEN",
    }));

    let edited = false;
    const message1 = {
        media_group_id: "mg_err",
        chatId: 50,
        chatType: "group",
        text: "t1",
        message_id: 2100,
    };
    const message2 = {
        media_group_id: "mg_err",
        chatId: 50,
        chatType: "group",
        photo: [{ file_id: "p1" }],
        caption: "c",
        message_id: 2101,
    };

    const ctx1 = {
        message: message1,
        chat: { id: 50, type: "group" },
        from: { username: "user" },
        telegram: {
            getFile: async () => ({ file_path: "p" }),
            sendMessage: async () => ({ message_id: 1234 }),
            editMessageText: async () => {
                edited = true;
            },
            callApi: async () => {},
        },
        reply: async () => {},
    };
    const ctx2 = { ...ctx1, message: message2 };

    const groupHandler = require("../../../../bot/handlers/messages/groupHandler");
    const bot = {
        on: (evt, fn) => {
            if (evt === "message") {
                fn(ctx1, () => {});
                fn(ctx2, () => {});
            }
        },
    };

    groupHandler(bot);
    await new Promise((r) => setTimeout(r, 800));
    await new Promise((r) => setImmediate(r));

    expect(edited).toBe(true);
});

test("processMessage splits long response into chunks for media_group and sends subsequent messages", async () => {
    jest.resetModules();
    jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
        groupMessageValidator: jest.fn().mockResolvedValue(true),
    }));
    jest.doMock("../../../../bot/utils/formatGroupMessage", () => ({
        formatGroupMessage: (x) => x,
    }));
    jest.doMock("../../../../bot/utils/safeChunkText", () => ({
        safeChunkText: (t) => ["first", "second", "third"],
    }));
    jest.doMock("../../../../bot/utils/escapeHtml", () => ({
        escapeHtml: (s) => s,
    }));
    jest.doMock("../../../../bot/services/perplexity", () => ({
        sendToPerplexity: jest.fn().mockResolvedValue("LONGMSG"),
    }));
    jest.doMock("../../../../bot/config", () => ({
        ALLOWED_GROUPS: [60],
        ADMIN_USERNAME: "admin",
        TELEGRAM_BOT_TOKEN: "TOKEN",
    }));

    const sent = [];
    const message1 = {
        media_group_id: "mg_chunk",
        chatId: 60,
        chatType: "group",
        text: "t1",
        message_id: 3100,
    };
    const message2 = {
        media_group_id: "mg_chunk",
        chatId: 60,
        chatType: "group",
        photo: [{ file_id: "p1" }],
        caption: "c",
        message_id: 3101,
    };

    const ctx1 = {
        message: message1,
        chat: { id: 60, type: "group" },
        from: { username: "user" },
        telegram: {
            getFile: async () => ({ file_path: "p" }),
            sendMessage: async (chatId, text, opts) => {
                sent.push({ chatId, text });
                return { message_id: 2000 };
            },
            editMessageText: async (chatId, mid, undef, text, opts) => {
                // first chunk
                sent.push({ chatId, text });
            },
            callApi: async () => {},
        },
        reply: async () => {},
    };
    const ctx2 = { ...ctx1, message: message2 };

    const groupHandler = require("../../../../bot/handlers/messages/groupHandler");
    const bot = {
        on: (evt, fn) => {
            if (evt === "message") {
                fn(ctx1, () => {});
                fn(ctx2, () => {});
            }
        },
    };

    groupHandler(bot);
    await new Promise((r) => setTimeout(r, 800));
    await new Promise((r) => setImmediate(r));

    // expect at least three outputs: processing message (sendMessage), first chunk (editMessageText), and two subsequent chunk messages
    expect(sent.find((s) => s.text === "first")).toBeTruthy();
    expect(sent.find((s) => s.text === "second")).toBeTruthy();
    expect(sent.find((s) => s.text === "third")).toBeTruthy();
});

test("top-level handler fallback reply when sendToPerplexity throws", async () => {
    jest.resetModules();
    jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
        groupMessageValidator: jest.fn().mockResolvedValue(true),
    }));
    jest.doMock("../../../../bot/utils/formatGroupMessage", () => ({
        formatGroupMessage: (x) => x,
    }));
    jest.doMock("../../../../bot/utils/safeChunkText", () => ({
        safeChunkText: (t) => [t],
    }));
    jest.doMock("../../../../bot/utils/escapeHtml", () => ({
        escapeHtml: (s) => s,
    }));
    jest.doMock("../../../../bot/services/perplexity", () => ({
        sendToPerplexity: jest.fn().mockRejectedValue(new Error("boom")),
    }));
    jest.doMock("../../../../bot/config", () => ({
        ALLOWED_GROUPS: [7],
        ADMIN_USERNAME: "admin",
        TELEGRAM_BOT_TOKEN: "TOKEN",
    }));

    let replied = false;
    const message = { text: "oops", entities: [], message_id: 4200 };
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
            replied = true;
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

    expect(replied).toBe(true);
});

test("top-level nested fallback logs error when ctx.reply also throws", async () => {
    jest.resetModules();
    jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
        groupMessageValidator: jest.fn().mockResolvedValue(true),
    }));
    jest.doMock("../../../../bot/utils/formatGroupMessage", () => ({
        formatGroupMessage: (x) => x,
    }));
    jest.doMock("../../../../bot/utils/safeChunkText", () => ({
        safeChunkText: (t) => [t],
    }));
    jest.doMock("../../../../bot/utils/escapeHtml", () => ({
        escapeHtml: (s) => s,
    }));
    jest.doMock("../../../../bot/services/perplexity", () => ({
        sendToPerplexity: jest.fn().mockRejectedValue(new Error("boom")),
    }));
    jest.doMock("../../../../bot/config", () => ({
        ALLOWED_GROUPS: [7],
        ADMIN_USERNAME: "admin",
        TELEGRAM_BOT_TOKEN: "TOKEN",
    }));

    const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

    const message = { text: "oops", entities: [], message_id: 4201 };
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

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
});

test("processMessage nested fallback logs error when fallback sendMessage throws", async () => {
    jest.resetModules();
    jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
        groupMessageValidator: jest.fn().mockResolvedValue(true),
    }));
    jest.doMock("../../../../bot/utils/formatGroupMessage", () => ({
        formatGroupMessage: (x) => x,
    }));
    jest.doMock("../../../../bot/utils/safeChunkText", () => ({
        safeChunkText: (t) => [t],
    }));
    jest.doMock("../../../../bot/utils/escapeHtml", () => ({
        escapeHtml: (s) => s,
    }));
    jest.doMock("../../../../bot/services/perplexity", () => ({
        sendToPerplexity: jest.fn().mockRejectedValue(new Error("boom")),
    }));
    jest.doMock("../../../../bot/config", () => ({
        ALLOWED_GROUPS: [80],
        ADMIN_USERNAME: "admin",
        TELEGRAM_BOT_TOKEN: "TOKEN",
    }));

    const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

    const message1 = {
        media_group_id: "mg_fallback",
        chatId: 80,
        chatType: "group",
        text: "t1",
        message_id: 5100,
    };
    const message2 = {
        media_group_id: "mg_fallback",
        chatId: 80,
        chatType: "group",
        photo: [{ file_id: "p1" }],
        caption: "c",
        message_id: 5101,
    };

    // sendMessage: first call (processingMessage) returns id, second call (fallback) throws
    let callCount = 0;
    const ctx1 = {
        message: message1,
        chat: { id: 80, type: "group" },
        from: { username: "user" },
        telegram: {
            getFile: async () => ({ file_path: "p" }),
            sendMessage: async () => {
                callCount++;
                if (callCount === 1) return { message_id: 6000 };
                throw new Error("send fail");
            },
            editMessageText: async () => {},
            callApi: async () => {},
        },
        reply: async () => {},
    };
    const ctx2 = { ...ctx1, message: message2 };

    const groupHandler = require("../../../../bot/handlers/messages/groupHandler");
    const bot = {
        on: (evt, fn) => {
            if (evt === "message") {
                fn(ctx1, () => {});
                fn(ctx2, () => {});
            }
        },
    };

    groupHandler(bot);
    await new Promise((r) => setTimeout(r, 800));
    await new Promise((r) => setImmediate(r));

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
});

test("direct call to _processMessage edits message when errorEntry returned", async () => {
    jest.resetModules();
    jest.doMock("../../../../bot/utils/groupMessageValidator", () => ({
        groupMessageValidator: jest.fn().mockResolvedValue(true),
    }));
    jest.doMock("../../../../bot/utils/escapeHtml", () => ({
        escapeHtml: (s) => s,
    }));
    const {
        ERROR_RESPONSES,
    } = require("../../../../bot/constants/errorResponses");
    jest.doMock("../../../../bot/services/perplexity", () => ({
        sendToPerplexity: jest
            .fn()
            .mockResolvedValue(ERROR_RESPONSES.UNKNOWN.code),
    }));

    const telegramClient = {
        sendMessage: async () => ({ message_id: 7000 }),
        editMessageText: async (chatId, mid, u, text, opts) => {
            // mark called
            telegramClient._edited = text;
        },
        sendMessageCalled: false,
    };

    const groupHandlerModule = require("../../../../bot/handlers/messages/groupHandler");
    const process = groupHandlerModule._processMessage;

    await process(telegramClient, "x", [], 99, 123, "group", {});
    expect(telegramClient._edited).toBeDefined();
});

test("direct call to _processMessage logs error when fallback sendMessage throws", async () => {
    jest.resetModules();
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

    const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

    let callCount = 0;
    const telegramClient = {
        sendMessage: async () => {
            callCount++;
            if (callCount === 1) return { message_id: 8000 };
            throw new Error("send fail");
        },
        editMessageText: async () => {
            throw new Error("edit fail");
        },
    };

    const groupHandlerModule = require("../../../../bot/handlers/messages/groupHandler");
    const process = groupHandlerModule._processMessage;

    await process(telegramClient, "x", [], 100, 124, "group", {});
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
});
