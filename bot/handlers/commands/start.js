module.exports = (bot) => {
    bot.start(async (ctx) => {
        if (ctx.chat.type !== "private") return;

        const name = [ctx.from?.first_name, ctx.from?.last_name]
            .filter(Boolean)
            .join(" ");

        await ctx.reply(
            `سلام ${name}\n\nبرای استفاده از امکانات بات، یکی از گزینه‌های زیر را انتخاب کنید.`,
            {
                reply_markup: {
                    keyboard: [
                        [{ text: "📝 دریافت لینک ارسال بازخورد" }],
                        [{ text: "📝 دریافت لینک پروفایل بازخوردها" }],
                    ],
                    resize_keyboard: true,
                    input_field_placeholder: "یک گزینه را انتخاب کنید",
                    is_persistent: true,
                },
            }
        );
    });
};
