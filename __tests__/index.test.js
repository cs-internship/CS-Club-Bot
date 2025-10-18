jest.resetModules();

jest.doMock("../bot", () => ({
    launch: jest.fn(() => Promise.resolve()),
    stop: jest.fn(),
}));
jest.doMock("../bot/config", () => ({ PORT: 3333 }));

// Mock express to capture route registrations and listen behavior
const mockGet = jest.fn();
const mockListen = jest.fn((port, cb) => cb && cb());
jest.mock("express", () => () => ({
    get: mockGet,
    listen: mockListen,
}));

describe("index (server bootstrap)", () => {
    beforeEach(() => {
        jest.resetModules();
        mockGet.mockClear();
        mockListen.mockClear();
    });

    test("starts express and launches bot", async () => {
        const bot = require("../bot");

        // requiring index will run the startup code
        require("../index");

        // express.get should have been used to register health route
        expect(mockGet).toHaveBeenCalledWith("/", expect.any(Function));

        // app.listen should be called with the mocked PORT
        expect(mockListen).toHaveBeenCalledWith(3333, expect.any(Function));

        // bot.launch should have been called
        expect(bot.launch).toHaveBeenCalled();
    });
});
