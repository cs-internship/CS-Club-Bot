const { version } = require("../../package.json");
const { ALLOWED_GROUPS } = require("../../config");

module.exports = (bot) => {
    bot.command("version", (ctx) => {
        if (
            ctx.chat.type !== "private" &&
            ALLOWED_GROUPS.includes(ctx.chat.id)
        ) {
            ctx.reply(`🤖 Bot version: ${version}`);
        }
    });
};
