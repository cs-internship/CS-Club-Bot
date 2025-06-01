// Core flow handlers
const startHandler = require("./handlers/commands/start");
const registrationHandler = require("./handlers/commands/registrationHandler");
const feedbackHandler = require("./handlers/commands/feedbackHandler");

// Command handlers
const versionCommand = require("./handlers/commands/version");
const groupIdCommand = require("./handlers/commands/groupId");

// Message & hear handlers
const groupHandler = require("./handlers/messages/groupHandler");
const feedbackSelection = require("./handlers/hears/feedbackSelection");
const documentsList = require("./handlers/hears/documentsList");
const mainMenu = require("./handlers/hears/mainMenu");
const feedbackLinks = require("./handlers/hears/feedbackLinks");

module.exports = (bot) => {
    // Core flows
    startHandler(bot);
    registrationHandler(bot);
    feedbackHandler(bot);

    // Commands
    versionCommand(bot);
    groupIdCommand(bot);

    // Messages & hears
    groupHandler(bot);
    feedbackLinks(bot);
    feedbackSelection(bot);
    documentsList(bot);
    mainMenu(bot);
};
