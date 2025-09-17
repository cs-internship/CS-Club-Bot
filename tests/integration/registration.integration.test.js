// Integration test example for registration flow
const registrationHandler = require("../../bot/handlers/commands/registrationHandler");

describe("Integration: Registration Flow", () => {
    it("should register a new user and return success", async () => {
        const mockCheckUserExists = jest.fn().mockResolvedValue(false);
        const mockNotion = {
            pages: { create: jest.fn().mockResolvedValue({}) },
        };
        const bot = { on: jest.fn((event, fn) => fn) };
        const ctx = {
            chat: { id: 123, type: "private" },
            from: { id: 123, username: "newuser" },
            message: { text: "register" },
            reply: jest.fn().mockResolvedValue({ message_id: 1 }),
            session: {},
            telegram: {
                deleteMessage: jest.fn(),
                editMessageText: jest.fn(),
                sendMessage: jest.fn(),
            },
        };
        const next = jest.fn();
        registrationHandler(bot, {
            checkUserExists: mockCheckUserExists,
            notionClient: mockNotion,
        });
        await bot.on.mock.calls[0][1](ctx, next);
        expect(
            ctx.reply.mock.calls.some(
                (call) =>
                    typeof call[0] === "string" &&
                    /ثبت نام با موفقیت انجام شد|success/i.test(call[0])
            )
        ).toBe(true);
    });
    it("should not register an already registered user", async () => {
        const mockCheckUserExists = jest.fn().mockResolvedValue(true);
        const mockNotion = {
            pages: { create: jest.fn().mockResolvedValue({}) },
        };
        const bot = { on: jest.fn((event, fn) => fn) };
        const ctx = {
            chat: { id: 123, type: "private" },
            from: { id: 123, username: "existinguser" },
            message: { text: "register" },
            reply: jest.fn().mockResolvedValue({ message_id: 1 }),
            session: {},
            telegram: {
                deleteMessage: jest.fn(),
                editMessageText: jest.fn(),
                sendMessage: jest.fn(),
            },
        };
        const next = jest.fn();
        registrationHandler(bot, {
            checkUserExists: mockCheckUserExists,
            notionClient: mockNotion,
        });
        await bot.on.mock.calls[0][1](ctx, next);
        expect(
            ctx.reply.mock.calls.some(
                (call) =>
                    typeof call[0] === "string" &&
                    /قبلا ثبت نام شده|already registered|exists/i.test(call[0])
            )
        ).toBe(true);
    });
});
