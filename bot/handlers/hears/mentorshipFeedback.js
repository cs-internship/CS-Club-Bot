module.exports = (bot) => {
    bot.hears("📝 ارسال بازخورد جلسه کارگاه منتورشیپ", async (ctx) => {
        try {
            await ctx.reply(
                "📄 ارسال بازخورد جلسه کارگاه منتورشیپ هنوز پیاده‌سازی نشده.",
                {
                    reply_markup: {
                        keyboard: [[{ text: "🔙 بازگشت" }]],
                        resize_keyboard: true,
                        is_persistent: true,
                    },
                }
            );
        } catch (err) {
            console.error("❌ Error showing documents list:", err);
            ctx.reply(
                "❌ مشکلی در نمایش بازخورد جلسه کارگاه منتورشیپ پیش آمد."
            );
        }
    });
};
