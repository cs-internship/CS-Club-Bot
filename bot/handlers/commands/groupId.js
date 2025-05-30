module.exports = (bot) => {
    bot.command("group_id", (ctx) => {
        ctx.reply(`🤖 Group ID: ${ctx.chat.id}`);
    });
};
