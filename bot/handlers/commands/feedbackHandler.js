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

            await ctx.reply("🔄 در حال آماده‌سازی لینک بازخورد...");
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

                const encryptedSend = encryptURL(combined);

                const feedbackUrl = `${FORM_BASE_URL}?form=${encodeURIComponent(
                    encryptedForm
                )}&send=${encodeURIComponent(encryptedSend)}`;

                const expirationDate = moment()
                    .add(7, "days")
                    .format("jD jMMMM");

                await ctx.reply(
                    `📝 <b>لینک اختصاصی ثبت بازخورد شما آماده است!</b>\n\n` +
                        `🔹 آیدی شما: <a href="https://t.me/${yourId}">@${yourId}</a>\n` +
                        `🔹 آیدی همیار فنی: <a href="https://t.me/${helperUsername}">@${helperUsername}</a>\n\n` +
                        `این لینک برای ثبت بازخورد با <b>نام کاربری شما</b> ساخته شده است.\n` +
                        `درصورت تغییر در آدرس، لینک معتبر نخواهد بود و بازخورد شما ارسال نخواهد شد.\n\n` +
                        `⚠️ لینک تا <b>${expirationDate}</b> قابل استفاده است.\n\n` +
                        `📎 <b>لینک شما:</b>\n${feedbackUrl}`,
                    {
                        parse_mode: "HTML",
                        disable_web_page_preview: true,
                    }
                );
            } catch (err) {
                console.error("❌ Feedback link error:", err);
                ctx.reply("❌ مشکلی در ساخت لینک بازخورد پیش آمد.");
            }
        }

        return next();
    });
};
