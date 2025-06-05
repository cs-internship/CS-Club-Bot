const moment = require("moment-jalaali");
const { getUsernameByFullname } = require("../../utils/getUsernameByFullname");
const CryptoJS = require("crypto-js");
const {
    USERNAME_SPECIAL_FN,
    ENCRYPTION_KEY,
    FORM_BASE_URL,
} = require("../../config");

moment.loadPersian({ usePersianDigits: true, dialect: "persian-modern" });

const encryptURL = (text) => {
    const specialUsername = eval(USERNAME_SPECIAL_FN)(text);
    const encrypted = CryptoJS.AES.encrypt(
        specialUsername,
        ENCRYPTION_KEY
    ).toString();

    return encrypted;
};

module.exports = (bot) => {
    bot.on("text", async (ctx, next) => {
        const text = ctx.message.text?.trim();

        if (ctx.session.step === "awaiting_user_selection") {
            if (
                !ctx.session.availableUsers ||
                !ctx.session.availableUsers.includes(text)
            ) {
                return ctx.reply(
                    "❗ لطفاً یکی از گزینه‌های موجود را انتخاب نمایید."
                );
            }

            ctx.session.selectedUser = text;
            ctx.session.step = "awaiting_feedback";

            const loadingMessage = await ctx.reply(
                "🔄 در حال آماده‌سازی لینک بازخورد...",
                {
                    reply_markup: {
                        remove_keyboard: true,
                    },
                }
            );
            ctx.session.loadingMessageId = loadingMessage.message_id;
        }

        if (ctx.session.step === "awaiting_feedback") {
            try {
                const username = ctx.from?.username;
                if (!username) {
                    return ctx.reply(
                        "❌ یوزرنیم شما وجود ندارد. لطفاً ابتدا در تنظیمات تلگرام برای خود یک username تعریف کنید."
                    );
                }

                const date = new Date()
                    .toISOString()
                    .slice(2, 10)
                    .replace(/-/g, "");
                const combined = `${username}:${date}`;
                const encryptedForm = encryptURL(combined);

                const yourId = ctx.from.username;
                const helperFullname = ctx.session.selectedUser;
                const helperUsername = await getUsernameByFullname(
                    helperFullname
                );

                if (!helperUsername) {
                    return ctx.reply(
                        "❗ یوزرنیم همیار فنی در دیتابیس پیدا نشد."
                    );
                }

                const encryptedSend = encryptURL(helperUsername);

                const feedbackUrl = `${FORM_BASE_URL}?form=${encodeURIComponent(
                    encryptedForm
                )}&send=${encodeURIComponent(encryptedSend)}`;

                const expirationDate = moment()
                    .add(7, "days")
                    .format("jD jMMMM");

                if (ctx.session.loadingMessageId) {
                    try {
                        await ctx.deleteMessage(ctx.session.loadingMessageId);
                        ctx.session.loadingMessageId = null;
                    } catch (err) {
                        console.warn("❗ Error deleting loading message:", err);
                    }
                }

                await ctx.reply(
                    `📝 <b>لینک اختصاصی ثبت بازخورد شما آماده است!</b>\n\n` +
                        `🔹 <b>یوزرنیم شما:</b> <a href="https://t.me/${yourId}">@${yourId}</a>\n` +
                        `🔹 <b>یوزرنیم همیار فنی:</b> <a href="https://t.me/${helperUsername}">@${helperUsername}</a>\n\n` +
                        `این لینک به‌صورت اختصاصی و بر اساس اطلاعات شما و همیار فنی ایجاد شده است.\n` +
                        `توجه داشته باشید که هرگونه تغییر در آدرس لینک باعث <b>نامعتبر</b> شدن آن می‌شود و در نتیجه بازخورد ثبت نخواهد شد.\n\n` +
                        `⚠️ این لینک تا تاریخ <b>${expirationDate}</b> معتبر است و پس از آن غیرفعال خواهد شد.\n\n` +
                        `📎 <b>لینک ثبت بازخورد:</b>\n${feedbackUrl}`,
                    {
                        parse_mode: "HTML",
                        disable_web_page_preview: true,
                        reply_markup: {
                            keyboard: [[{ text: "🔙 بازگشت به منو اصلی" }]],
                            resize_keyboard: true,
                            is_persistent: true,
                        },
                    }
                );

                ctx.session.step = null;
                ctx.session.selectedUser = null;
                ctx.session.availableUsers = null;
            } catch (err) {
                console.error("❌ Feedback link error:", err);
                ctx.reply("❌ مشکلی در ساخت لینک بازخورد پیش آمد.");
            }
        }

        return next();
    });
};
