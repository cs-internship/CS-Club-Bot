describe("mainMenu handler", () => {
    test("replies with menu when '🔙 بازگشت' heard", async () => {
        const replies = [];
        const ctx = {
            reply: async (text, opts) => replies.push({ text, opts }),
        };
        const bot = {
            hears: (msg, fn) => {
                if (msg === "🔙 بازگشت") fn(ctx);
            },
        };
        const module = require("../../../../bot/handlers/hears/mainMenu");
        module(bot);
        expect(replies.length).toBe(1);
        expect(replies[0].text).toMatch(/لطفاً یکی از گزینه‌های زیر/);
    });

    test("replies for other synonyms", async () => {
        const replies = [];
        const ctx = {
            reply: async (text, opts) => replies.push({ text, opts }),
        };
        const bot = {
            hears: (msg, fn) => {
                if (msg === "🔙 بازگشت به منو اصلی") fn(ctx);
                if (msg === "🔙 منو اصلی") fn(ctx);
            },
        };
        const module = require("../../../../bot/handlers/hears/mainMenu");
        module(bot);
        expect(replies.length).toBe(2);
    });

    test("logs and replies on error path", async () => {
        console.error = jest.fn();
        let call = 0;
        const ctx = {
            reply: async (t) => {
                call++;
                if (call === 1) return Promise.reject(new Error("boom"));
                return Promise.resolve();
            },
        };
        const bot = {
            hears: (msg, fn) => {
                if (msg === "🔙 بازگشت") fn(ctx);
            },
        };
        const module = require("../../../../bot/handlers/hears/mainMenu");
        module(bot);
        await new Promise((r) => setImmediate(r));
        expect(console.error).toHaveBeenCalled();
    });
});
