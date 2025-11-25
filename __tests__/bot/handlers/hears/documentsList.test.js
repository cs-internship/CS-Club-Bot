describe("documentsList handler", () => {
    test("replies with not implemented message on success", async () => {
        const replies = [];
        const ctx = {
            reply: async (text, opts) => replies.push({ text, opts }),
        };
        const bot = { hears: (msg, fn) => fn(ctx) };
        const module = require("../../../../bot/handlers/hears/documentsList");
        module(bot);
        expect(replies.length).toBe(1);
        expect(replies[0].text).toMatch(/لیست داکیومنت/);
        expect(replies[0].opts).toBeDefined();
    });

    test("logs and replies on error path", async () => {
        const errors = [];
        console.error = jest.fn((...args) => errors.push(args.join(" ")));

        let call = 0;
        const ctx = {
            reply: async (t) => {
                call++;
                if (call === 1) return Promise.reject(new Error("boom"));
                return Promise.resolve();
            },
        };
        const bot = { hears: (msg, fn) => fn(ctx) };
        const module = require("../../../../bot/handlers/hears/documentsList");
        module(bot);

        // give microtask a tick
        await new Promise((r) => setImmediate(r));
        expect(console.error).toHaveBeenCalled();
    });
});
