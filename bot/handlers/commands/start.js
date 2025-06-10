const { checkUserExists } = require("../../utils/checkUserExists");

require("dotenv").config();

module.exports = (bot) => {
    bot.start(async (ctx) => {
        if (ctx.chat.type !== "private") return;

        if (!ctx.from.username) {
            return ctx.reply(
                "❗ برای استفاده از این بات، لازم است حساب کاربری شما دارای یوزرنیم باشد.\n" +
                    "لطفاً ابتدا یک یوزرنیم برای اکانت خود در تنظیمات تلگرام تعریف نمایید."
            );
        }

        const telegramId = ctx.from.id;
        const firstName = ctx.from?.first_name || "";
        const lastName = ctx.from?.last_name || "";
        const fullName = [firstName, lastName].filter(Boolean).join(" ");

        const isRegistered = await checkUserExists(telegramId);
        if (isRegistered) {
            ctx.session.registered = true;
            return ctx.reply(
                `✅ ثبت‌نام شما قبلاً انجام شده است.\n\nبرای ادامه لطفاً از منوی اصلی استفاده نمایید.`,
                {
                    reply_markup: {
                        keyboard: [[{ text: "🔙 منو اصلی" }]],
                        resize_keyboard: true,
                        is_persistent: true,
                    },
                }
            );
        }

        ctx.session.registered = false;
        ctx.session.step = null;
        ctx.session.selectedUser = null;
        ctx.session.loadingMessageId = null;
        ctx.session.availableUsers = null;

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
