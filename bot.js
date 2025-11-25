const { Telegraf, session } = require("telegraf");

const { TELEGRAM_BOT_TOKEN } = require("./bot/config");
const registerHandlers = require("./bot/registerHandlers");

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

bot.use(session({ defaultSession: () => ({ registered: false }) }));

registerHandlers(bot);

module.exports = bot;
