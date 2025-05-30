module.exports = {
    async showDocumentsList(ctx) {
        await ctx.reply("📄 لیست داکیومنت‌ها هنوز پیاده‌سازی نشده.", {
            reply_markup: {
                keyboard: [[{ text: "🔙 بازگشت" }]],
                resize_keyboard: true,
                is_persistent: true,
            },
        });
    },
};
