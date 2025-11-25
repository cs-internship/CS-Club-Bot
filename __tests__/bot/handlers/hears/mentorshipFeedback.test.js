describe("mentorshipFeedback handler", () => {
    test("replies with not implemented message on success", async () => {
        const replies = [];
        const ctx = {
            reply: async (text, opts) => replies.push({ text, opts }),
        };
        const bot = { hears: (msg, fn) => fn(ctx) };
        const module = require("../../../../bot/handlers/hears/mentorshipFeedback");
        module(bot);
        expect(replies.length).toBe(1);
        expect(replies[0].text).toMatch(/بازخورد جلسه کارگاه منتورشیپ/);
    });

    test("logs and replies on error path", async () => {
        console.error = jest.fn();
        let call = 0;
        const ctx = {
            reply: async (_t) => {
                call++;
                if (call === 1) return Promise.reject(new Error("boom"));
                return Promise.resolve();
            },
        };
        const bot = { hears: (msg, fn) => fn(ctx) };
        const module = require("../../../../bot/handlers/hears/mentorshipFeedback");
        module(bot);
        await new Promise((r) => setImmediate(r));
        expect(console.error).toHaveBeenCalled();
    });
});
