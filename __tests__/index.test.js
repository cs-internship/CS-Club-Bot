/* eslint-env jest */
describe("index.js startup", () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        jest.resetModules();
        process.env = { ...OLD_ENV };
    });
    afterEach(() => {
        process.env = OLD_ENV;
        jest.restoreAllMocks();
    });

    test("starts express and launches bot (success path)", async () => {
        const mockGet = jest.fn();
        const mockListen = jest.fn((port, cb) => cb && cb());
        const mockApp = { get: mockGet, listen: mockListen };

        jest.doMock("express", () => jest.fn(() => mockApp));

        const launchMock = jest.fn().mockResolvedValue();
        const stopMock = jest.fn();
        jest.doMock("../bot", () => ({ launch: launchMock, stop: stopMock }));
        jest.doMock("../bot/config", () => ({ PORT: 5555 }));

        const onceSpy = jest
            .spyOn(process, "once")
            .mockImplementation((evt, cb) => {
                // immediately invoke shutdown handlers to exercise their bodies
                if (typeof cb === "function") cb();
            });
        const onSpy = jest
            .spyOn(process, "on")
            .mockImplementation((evt, cb) => {
                // invoke uncaughtException handler with a test error to exercise the error branch
                if (evt === "uncaughtException" && typeof cb === "function") {
                    {
                        cb(new Error("test-ex"));
                    }
                }
            });
        const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        const errorSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});

        // load the module under the mocks and wait for the bot.launch then-handler
        await jest.isolateModulesAsync(async () => {
            // requiring the module will call app.listen and bot.launch
            // eslint-disable-next-line global-require
            require("../index.js");
            // allow microtasks to flush so the then() handler runs
            await new Promise((r) => setImmediate(r));
        });

        // app.get should be registered for health check
        expect(mockGet).toHaveBeenCalled();
        // listen should be called with the PORT
        expect(mockListen).toHaveBeenCalledWith(5555, expect.any(Function));

        // bot.launch should have been called and its success logged
        expect(launchMock).toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining("🚀 Express running")
        );
        expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining("🤖 Telegram bot launched")
        );

        // process event handlers should have been registered
        expect(onceSpy).toHaveBeenCalled();
        expect(onSpy).toHaveBeenCalled();

        logSpy.mockRestore();
        errorSpy.mockRestore();
        onceSpy.mockRestore();
        onSpy.mockRestore();
    });

    test("logs error when bot.launch rejects (failure path)", async () => {
        jest.resetModules();

        const mockGet = jest.fn();
        const mockListen = jest.fn((port, cb) => cb && cb());
        const mockApp = { get: mockGet, listen: mockListen };
        jest.doMock("express", () => jest.fn(() => mockApp));

        const launchMock = jest.fn().mockRejectedValue(new Error("boom"));
        const stopMock = jest.fn();
        jest.doMock("../bot", () => ({ launch: launchMock, stop: stopMock }));
        jest.doMock("../bot/config", () => ({ PORT: 9999 }));

        const onceSpy = jest
            .spyOn(process, "once")
            .mockImplementation((evt, cb) => {
                if (typeof cb === "function") cb();
            });
        const onSpy = jest
            .spyOn(process, "on")
            .mockImplementation((evt, cb) => {
                if (evt === "uncaughtException" && typeof cb === "function") {
                    {
                        cb(new Error("test-ex"));
                    }
                }
            });
        const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        const errorSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});

        await jest.isolateModulesAsync(async () => {
            // require module which triggers the listen callback
            // eslint-disable-next-line global-require
            require("../index.js");
            // allow microtasks to flush so the rejected promise is handled
            await new Promise((r) => setImmediate(r));
        });

        expect(mockGet).toHaveBeenCalled();
        expect(mockListen).toHaveBeenCalledWith(9999, expect.any(Function));
        expect(launchMock).toHaveBeenCalled();

        // ensure the error branch was hit
        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining("❌ Error launching bot:"),
            expect.any(Error)
        );

        onceSpy.mockRestore();
        onSpy.mockRestore();
        logSpy.mockRestore();
        errorSpy.mockRestore();
    });
});
// Note: tests above cover startup behavior with isolateModules so no duplicate suite needed.
