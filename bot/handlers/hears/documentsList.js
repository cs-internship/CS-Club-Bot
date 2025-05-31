module.exports = (bot) => {
    bot.hears("📚 لیست داکیومنت‌های موجود", async (ctx) => {
        try {
            await ctx.reply("📄 لیست داکیومنت‌ها هنوز پیاده‌سازی نشده.", {
                reply_markup: {
                    keyboard: [[{ text: "🔙 بازگشت" }]],
                    resize_keyboard: true,
                    is_persistent: true,
                },
            });
        } catch (err) {
            console.error("❌ Error showing documents list:", err);
            ctx.reply("❌ مشکلی در نمایش لیست داکیومنت‌ها پیش آمد.");
        }
    });
};
