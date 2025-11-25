// Core flow handlers

// Command handlers
const directMessageCommand = require("./handlers/commands/directMessage");
const feedbackHandler = require("./handlers/commands/feedbackHandler");
const groupIdCommand = require("./handlers/commands/groupId");
const registrationHandler = require("./handlers/commands/registrationHandler");
const startHandler = require("./handlers/commands/start");
const versionCommand = require("./handlers/commands/version");
const documentsList = require("./handlers/hears/documentsList");
const feedbackSelection = require("./handlers/hears/feedbackSelection");
const mainMenu = require("./handlers/hears/mainMenu");
const mentorshipFeedback = require("./handlers/hears/mentorshipFeedback");
const groupHandler = require("./handlers/messages/groupHandler");

module.exports = (bot) => {
    // Core flows
    startHandler(bot);
    registrationHandler(bot);
    feedbackHandler(bot);

    // Commands
    versionCommand(bot);
    groupIdCommand(bot);
    directMessageCommand(bot);

    // Messages & hears
    groupHandler(bot);
    feedbackSelection(bot);
    documentsList(bot);
    mainMenu(bot);
    mentorshipFeedback(bot);
};
