const { version } = require("../../../package.json");
const { ALLOWED_GROUPS, IS_TEST_BOT } = require("../../config");

module.exports = (bot) => {
    bot.command("version", (ctx) => {
        if (
            ctx.chat.type !== "private" &&
            ALLOWED_GROUPS.includes(ctx.chat.id)
        ) {
            const versionLabel = IS_TEST_BOT ? `${version} - test` : version;
            ctx.reply(`🤖 Bot version: ${versionLabel}`);
        }
    });
};
