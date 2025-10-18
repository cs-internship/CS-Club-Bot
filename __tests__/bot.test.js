describe("bot.js module", () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    test("creates a Telegraf instance, uses session and registers handlers", () => {
        const useMock = jest.fn();
        const TelegrafMock = jest.fn(() => ({ use: useMock }));

        const receivedSessionOptions = {};
        const sessionMock = jest.fn((opts) => {
            // capture the options for assertions and return a middleware stub
            Object.assign(receivedSessionOptions, opts);
            return () => {};
        });

        const token = "FAKE_TOKEN";
        const registerHandlersMock = jest.fn();

        jest.doMock("telegraf", () => ({
            Telegraf: TelegrafMock,
            session: sessionMock,
        }));
        jest.doMock("../bot/config", () => ({ TELEGRAM_BOT_TOKEN: token }));
        jest.doMock("../bot/registerHandlers", () => registerHandlersMock);

        // require the module under test
        // eslint-disable-next-line global-require
        const bot = require("../bot");

        // Telegraf should be constructed with the token
        expect(TelegrafMock).toHaveBeenCalledWith(token);

        // session should have been called with defaultSession option
        expect(sessionMock).toHaveBeenCalled();
        expect(receivedSessionOptions).toHaveProperty("defaultSession");
        // defaultSession should return the initial session object
        const defaultSessionResult = receivedSessionOptions.defaultSession();
        expect(defaultSessionResult).toEqual({ registered: false });

        // the returned bot instance should have had .use called with the middleware
        expect(useMock).toHaveBeenCalled();

        // registerHandlers should be called with the bot instance
        expect(registerHandlersMock).toHaveBeenCalledWith(
            expect.objectContaining({ use: expect.any(Function) })
        );

        // exported bot should be the same object returned by TelegrafMock
        expect(bot).toBeDefined();
        expect(bot).toHaveProperty("use");
    });
});
