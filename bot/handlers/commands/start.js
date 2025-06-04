module.exports = (bot) => {
    bot.start(async (ctx) => {
        if (ctx.chat.type !== "private") return;

        if (!ctx.from.username) {
            return ctx.reply(
                "❗ برای استفاده از این بات، لازم است حساب کاربری شما دارای یوزرنیم باشد.\n" +
                    "لطفاً ابتدا یک یوزرنیم برای اکانت خود در تنظیمات تلگرام تعریف نمایید."
            );
        }

        const firstName = ctx.from?.first_name || "";
        const lastName = ctx.from?.last_name || "";
        const fullName = [firstName, lastName].filter(Boolean).join(" ");

        ctx.session.registered = false;

        await ctx.reply(
            `سلام ${fullName} 🌟\n\nبرای استفاده از امکانات بات، لطفاً اسم و فامیل خود را به فارسی ارسال نمایید.`,
            {
                reply_markup: {
                    remove_keyboard: true,
                },
            }
        );
    });
};
