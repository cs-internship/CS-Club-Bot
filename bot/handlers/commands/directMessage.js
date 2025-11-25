const { ADMIN_CHAT_ID } = require("../../config");

module.exports = (bot) => {
    bot.command("direct", async (ctx) => {
        try {
            const chatId = ctx.chat.id;

            if (+chatId !== +ADMIN_CHAT_ID) return;

            const messageText = ctx.message.text;
            const args = messageText.split(" ").slice(1);

            const targetId = args[0];
            const customMessage = args.slice(1).join(" ");

            if (!targetId || !customMessage) {
                await ctx.reply(
                    "❌ لطفاً دستور را به‌صورت زیر وارد کنید:\n\n`/direct <telegram_id> <پیام>`",
                    {
                        parse_mode: "Markdown",
                    }
                );
                return;
            }

            await bot.telegram.sendMessage(
                targetId,
                `
📩 <b>پیام از طرف ادمین:</b>

${customMessage}

`,
                { parse_mode: "HTML" }
            );

            await ctx.reply(
                `
✅ پیام با موفقیت ارسال شد.

👤 <b>گیرنده:</b> <code>${targetId}</code>  
✉️ <b>پیام:</b>
${customMessage}
`,
                { parse_mode: "HTML" }
            );
        } catch (error) {
            console.error("❌ Error in direct command >>", error);

            await ctx.reply(
                "❌ ارسال پیام به کاربر با خطا مواجه شد. لطفا آیدی را بررسی کنید."
            );
        }
    });
};
