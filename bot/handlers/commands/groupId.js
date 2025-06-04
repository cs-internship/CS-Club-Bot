module.exports = (bot) => {
    bot.command("group_id", (ctx) => {
        ctx.reply(`🤖 Group ID: ${ctx.chat.id}`, {
            reply_markup: {
                remove_keyboard: true,
            },
        });
    });
};
