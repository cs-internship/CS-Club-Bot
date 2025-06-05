const { Client } = require("@notionhq/client");
const mainMenu = require("../scenes/mainMenu");
const { NOTION_API_KEY, NOTION_DATABASE_ID } = require("../../config");
const { checkUserExists } = require("../../utils/checkUserExists");
require("dotenv").config();

const notion = new Client({ auth: NOTION_API_KEY });

module.exports = (bot) => {
    bot.on("text", async (ctx, next) => {
        if (
            ctx.chat.type !== "private" ||
            !ctx.session ||
            ctx.session.registered
        ) {
            return next();
        }

        const telegramId = ctx.from.id;

        const checkingMessage = await ctx.reply(
            "🔍 در حال بررسی اطلاعات شما..."
        );

        let alreadyRegistered = false;

        try {
            alreadyRegistered = await checkUserExists(telegramId);
        } catch (err) {
            console.error("❌ Error checking Notion for user:", err);
        }

        try {
            await ctx.telegram.deleteMessage(
                ctx.chat.id,
                checkingMessage.message_id
            );
        } catch (err) {
            console.warn("⚠️ Couldn't delete checking message:", err);
        }

        if (alreadyRegistered) {
            ctx.session.registered = true;

            await ctx.reply(
                `بات به‌روزرسانی شده و مجدداً راه‌اندازی شده است.\n\n` +
                    `✅ اطلاعات ثبت‌نامی شما قبلاً ذخیره شده و نیازی به ثبت‌نام مجدد نیست.\n\n` +
                    `برای ادامه، لطفاً از منوی اصلی استفاده نمایید.`,
                {
                    reply_markup: {
                        keyboard: [[{ text: "🔙 منو اصلی" }]],
                        resize_keyboard: true,
                        is_persistent: true,
                    },
                }
            );

            return;
        }

        const fullNameInput = ctx.message.text?.trim();
        if (!fullNameInput || fullNameInput.length < 3) {
            return ctx.reply(
                "❗ لطفاً اسم و فامیل خود را به صورت کامل و با حداقل ۳ کاراکتر ارسال نمایید."
            );
        }

        const userData = {
            telegram_id: telegramId,
            username: ctx.from.username || "(ندارد)",
            name_on_account: [ctx.from.first_name, ctx.from.last_name]
                .filter(Boolean)
                .join(" "),
            full_name_input: fullNameInput,
            date: new Date().toISOString(),
        };

        const loadingMessage = await ctx.reply("🔄 در حال ثبت اطلاعات شما...");
        ctx.session.loadingMessageId = loadingMessage.message_id;

        try {
            await notion.pages.create({
                parent: { database_id: NOTION_DATABASE_ID },
                properties: {
                    "Full Name": {
                        title: [
                            { text: { content: userData.full_name_input } },
                        ],
                    },
                    "Telegram ID": { number: userData.telegram_id },
                    Username: {
                        rich_text: [{ text: { content: userData.username } }],
                    },
                    "Name on Account": {
                        rich_text: [
                            { text: { content: userData.name_on_account } },
                        ],
                    },
                    "Registration Date": {
                        date: { start: userData.date },
                    },
                },
            });

            ctx.session.registered = true;

            if (ctx.session.loadingMessageId) {
                try {
                    await ctx.telegram.editMessageText(
                        ctx.chat.id,
                        ctx.session.loadingMessageId,
                        undefined,
                        `✅ اطلاعات شما با موفقیت ثبت شد ${fullNameInput}.`
                    );
                    ctx.session.loadingMessageId = null;
                } catch (err) {
                    console.warn("❗ Error editing loading message:", err);
                    await ctx.reply(
                        `✅ اطلاعات شما با موفقیت ثبت شد ${fullNameInput}.`
                    );
                }
            } else {
                await ctx.reply(
                    `✅ اطلاعات شما با موفقیت ثبت شد ${fullNameInput}.`
                );
            }

            await mainMenu.showMainMenu(ctx);
        } catch (err) {
            console.error("❌ Error saving user data to Notion:", err);
            await ctx.reply(
                "❌ مشکلی در ذخیره اطلاعات پیش آمده است. لطفاً بعداً تلاش نمایید."
            );
        }
    });
};
