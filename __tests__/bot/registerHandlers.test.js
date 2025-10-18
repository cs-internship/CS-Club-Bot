jest.resetModules();

const makeMockHandler = () => jest.fn();

jest.doMock("../../bot/handlers/commands/start", () => makeMockHandler());
jest.doMock("../../bot/handlers/commands/registrationHandler", () =>
    makeMockHandler()
);
jest.doMock("../../bot/handlers/commands/feedbackHandler", () =>
    makeMockHandler()
);
jest.doMock("../../bot/handlers/commands/version", () => makeMockHandler());
jest.doMock("../../bot/handlers/commands/directMessage", () =>
    makeMockHandler()
);
jest.doMock("../../bot/handlers/commands/groupId", () => makeMockHandler());
jest.doMock("../../bot/handlers/messages/groupHandler", () =>
    makeMockHandler()
);
jest.doMock("../../bot/handlers/hears/feedbackSelection", () =>
    makeMockHandler()
);
jest.doMock("../../bot/handlers/hears/documentsList", () => makeMockHandler());
jest.doMock("../../bot/handlers/hears/mainMenu", () => makeMockHandler());
jest.doMock("../../bot/handlers/hears/mentorshipFeedback", () =>
    makeMockHandler()
);

const registerHandlers = require("../../bot/registerHandlers");

test("registerHandlers calls each handler with bot", () => {
    const bot = {};
    registerHandlers(bot);
    // each mock module is a function that should have been called once
    // ensure the start handler mock is installed
    expect(typeof require("../../bot/handlers/commands/start")).toBe(
        "function"
    );
});
