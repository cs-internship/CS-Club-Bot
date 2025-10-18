jest.resetModules();

jest.doMock("../../../../bot/utils/checkUserBanned", () => ({
    checkUserBanned: jest.fn(),
}));
jest.doMock("../../../../bot/utils/getUsernameByFullname", () => ({
    getUsernameByFullname: jest.fn(),
}));
jest.doMock("../../../../bot/config", () => ({
    USERNAME_SPECIAL_FN: "x=>x",
    ENCRYPTION_KEY: "k",
    FORM_BASE_URL: "https://form",
}));

const { checkUserBanned } = require("../../../../bot/utils/checkUserBanned");
const {
    getUsernameByFullname,
} = require("../../../../bot/utils/getUsernameByFullname");
const feedbackModule = require("../../../../bot/handlers/commands/feedbackHandler");

// helper to create bot that immediately calls on('text') handler with ctx
const makeBotAndRun = (ctx) => {
    // capture the promise returned by the async handler so tests can await it
    let handlerResult;
    const bot = {
        on: (evt, fn) => {
            handlerResult = fn(ctx, () => {});
            return handlerResult;
        },
    };
    feedbackModule(bot);
    return handlerResult;
};

test("awaiting_user_selection: valid selection sets loadingMessageId and advances step", async () => {
    const replies = [];
    const ctx = {
        message: { text: "A" },
        session: {
            step: "awaiting_user_selection",
            availableUsers: ["A", "B"],
        },
        from: { username: null },
        reply: async (t) => {
            replies.push(t);
            // return a loading message object when the loading reply is sent
            return { message_id: 111 };
        },
    };

    await makeBotAndRun(ctx);

    expect(ctx.session.selectedUser).toBe("A");
    expect(ctx.session.step).toBe("awaiting_feedback");
    expect(ctx.session.loadingMessageId).toBe(111);
    // the first reply should be the loading message text
    expect(
        replies.some((r) => String(r).includes("در حال آماده‌سازی لینک"))
    ).toBe(true);
});

test("awaiting_feedback: checkUserBanned returns null -> show error reply", async () => {
    checkUserBanned.mockResolvedValue(null);
    const replies = [];
    const ctx = {
        message: { text: "hi" },
        session: { step: "awaiting_feedback", selectedUser: "A" },
        from: { username: "u" },
        reply: async (t) => replies.push(t),
    };

    await makeBotAndRun(ctx);

    expect(replies[0]).toMatch(/مشکلی در بررسی/);
});

test("awaiting_feedback: helper username missing -> informs user", async () => {
    checkUserBanned.mockResolvedValue(false);
    getUsernameByFullname.mockResolvedValue(null);

    const replies = [];
    const ctx = {
        message: { text: "hi" },
        session: { step: "awaiting_feedback", selectedUser: "Helper" },
        from: { username: "me" },
        reply: async (t) => replies.push(t),
    };

    await makeBotAndRun(ctx);

    expect(
        replies.some((r) =>
            String(r).includes("یوزرنیم همیار فنی در دیتابیس پیدا نشد")
        )
    ).toBe(true);
});

test("awaiting_feedback: deleteMessage throws -> warns but continues", async () => {
    checkUserBanned.mockResolvedValue(false);
    getUsernameByFullname.mockResolvedValue("helperUser");

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const replies = [];
    const ctx = {
        message: { text: "hi" },
        session: {
            step: "awaiting_feedback",
            selectedUser: "Helper",
            loadingMessageId: 555,
        },
        from: { username: "me" },
        reply: async (t) => replies.push(t),
        deleteMessage: async () => {
            throw new Error("delete fail");
        },
    };

    await makeBotAndRun(ctx);

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
});

test("awaiting_feedback: unexpected exception triggers catch and error reply", async () => {
    checkUserBanned.mockResolvedValue(false);
    getUsernameByFullname.mockImplementation(() => {
        throw new Error("boom");
    });

    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const replies = [];
    const ctx = {
        message: { text: "hi" },
        session: { step: "awaiting_feedback", selectedUser: "Helper" },
        from: { username: "me" },
        reply: async (t) => replies.push(t),
        deleteMessage: async () => {},
    };

    await makeBotAndRun(ctx);

    expect(errSpy).toHaveBeenCalled();
    expect(
        replies.some((r) =>
            String(r).includes("مشکلی در ساخت لینک بازخورد پیش آمد")
        )
    ).toBe(true);
    errSpy.mockRestore();
});

test("feedback returns on back button", () => {
    const ctx = {
        message: { text: "🔙 بازگشت" },
        session: { step: "awaiting_user_selection" },
        reply: async () => {},
    };
    expect(() => makeBotAndRun(ctx)).not.toThrow();
});

test("feedback prompts when invalid selection", async () => {
    const replies = [];
    const ctx = {
        message: { text: "NotInList" },
        session: {
            step: "awaiting_user_selection",
            availableUsers: ["A", "B"],
        },
        reply: async (t) => replies.push(t),
    };
    makeBotAndRun(ctx);
    expect(replies[0]).toMatch(/لطفاً یکی از گزینه‌های موجود/);
});

test("feedback handles awaiting_feedback without username", async () => {
    const replies = [];
    const ctx = {
        message: { text: "hi" },
        session: { step: "awaiting_feedback", selectedUser: "A" },
        from: { username: null },
        reply: async (t) => replies.push(t),
    };
    makeBotAndRun(ctx);
    expect(replies[0]).toMatch(/یوزرنیم شما وجود ندارد/);
});

test("feedback handles banned user", async () => {
    checkUserBanned.mockResolvedValue(true);
    const replies = [];
    const ctx = {
        message: { text: "hi" },
        session: { step: "awaiting_feedback", selectedUser: "A" },
        from: { username: "u" },
        reply: async (t) => replies.push(t),
    };
    await makeBotAndRun(ctx);
    expect(replies[0]).toMatch(/بن شده/);
});

test("feedback builds and replies with feedback url", async () => {
    checkUserBanned.mockResolvedValue(false);
    getUsernameByFullname.mockResolvedValue("helperUser");
    const replies = [];
    const ctx = {
        message: { text: "hi" },
        session: { step: "awaiting_feedback", selectedUser: "Helper" },
        from: { username: "me" },
        reply: async (t, opts) => replies.push({ t, opts }),
        deleteMessage: async () => {},
    };
    await makeBotAndRun(ctx);
    // allow async work
    await Promise.resolve();
    // reply should contain the helper username mention and an HTML formatted message
    expect(
        replies.some(
            (r) => typeof r.t === "string" && r.t.includes("@helperUser")
        )
    ).toBe(true);
});
