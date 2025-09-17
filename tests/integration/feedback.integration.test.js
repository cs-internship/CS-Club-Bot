// Integration test example for feedback flow
const feedbackHandler = require("../../bot/handlers/commands/feedbackHandler");

describe("Integration: Feedback Flow", () => {
    it("should submit feedback and return confirmation", async () => {
        const mockCheckUserBanned = jest.fn().mockResolvedValue(false);
        const mockGetUsernameByFullname = jest
            .fn()
            .mockResolvedValue("helperuser");
        const bot = { on: jest.fn((event, fn) => fn) };
        const ctx = {
            chat: { id: 123, type: "private" },
            from: { id: 123, username: "user1" },
            message: { text: "عالی بود" },
            reply: jest.fn(),
            session: { step: "awaiting_feedback", selectedUser: "helper" },
        };
        const next = jest.fn();
        feedbackHandler(bot, {
            checkUserBanned: mockCheckUserBanned,
            getUsernameByFullname: mockGetUsernameByFullname,
        });
        await bot.on.mock.calls[0][1](ctx, next);
        expect(
            ctx.reply.mock.calls.some(
                (call) =>
                    typeof call[0] === "string" &&
                    /بازخورد شما ثبت شد|feedback received|success|لینک اختصاصی ثبت بازخورد/i.test(
                        call[0]
                    )
            )
        ).toBe(true);
    });
    it("should handle invalid feedback gracefully", async () => {
        const mockCheckUserBanned = jest.fn().mockResolvedValue(false);
        const mockGetUsernameByFullname = jest
            .fn()
            .mockResolvedValue("helperuser");
        const bot = { on: jest.fn((event, fn) => fn) };
        const ctx = {
            chat: { id: 123, type: "private" },
            from: { id: 123, username: "user1" },
            message: { text: "" }, // No feedback text
            reply: jest.fn(),
            session: {},
        };
        const next = jest.fn();
        feedbackHandler(bot, {
            checkUserBanned: mockCheckUserBanned,
            getUsernameByFullname: mockGetUsernameByFullname,
        });
        await bot.on.mock.calls[0][1](ctx, next);
        expect(
            ctx.reply.mock.calls.some(
                (call) =>
                    typeof call[0] === "string" &&
                    /لطفا بازخورد خود را وارد کنید|please provide feedback|invalid|بازخورد.*وارد کنید/i.test(
                        call[0]
                    )
            )
        ).toBe(true);
    });
});
