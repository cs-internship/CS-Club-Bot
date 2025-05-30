const { Telegraf, session } = require("telegraf");
const { TELEGRAM_BOT_TOKEN } = require("./config");

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
bot.use(
    session({
        defaultSession: () => ({
            registered: false,
        }),
    })
);

require("./handlers/messages/groupHandler")(bot);
require("./handlers/commands/version")(bot);
require("./handlers/commands/groupId")(bot);
require("./handlers/commands/start")(bot);
require("./handlers/hears/feedbackLinks")(bot);

module.exports = bot;
