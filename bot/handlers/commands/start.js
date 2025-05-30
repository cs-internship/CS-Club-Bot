const { Client } = require("@notionhq/client");
require("dotenv").config();

const NOTION_API_KEY = new Client({ auth: process.env.NOTION_API_KEY });
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

const mainMenu = require("../scenes/mainMenu");
const feedbackSelect = require("../scenes/feedbackSelect");
const documentsList = require("../scenes/documentsList");

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

        if (!ctx.session) ctx.session = {};

        ctx.session.registered = false;

        await ctx.reply(
            `سلام ${fullName} 🌟\n\nبرای استفاده از امکانات بات، لطفاً اسم و فامیل خود را به فارسی ارسال نمایید.`
        );
    });

    bot.on("text", async (ctx, next) => {
        if (!ctx.session || ctx.session.registered) return next();

        const fullNameInput = ctx.message.text?.trim();

        if (!fullNameInput || fullNameInput.length < 3) {
            return ctx.reply(
                "❗ لطفاً اسم و فامیل خود را به صورت کامل و با حداقل ۳ کاراکتر ارسال نمایید."
            );
        }

        const userData = {
            telegram_id: ctx.from.id,
            username: ctx.from.username || "(ندارد)",
            name_on_account: [ctx.from.first_name, ctx.from.last_name]
                .filter(Boolean)
                .join(" "),
            full_name_input: fullNameInput,
            date: new Date().toISOString(),
        };

        try {
            await NOTION_API_KEY.pages.create({
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
                    "Registration Date": { date: { start: userData.date } },
                },
            });

            ctx.session.registered = true;

            await mainMenu.showMainMenu(ctx, fullNameInput);
        } catch (err) {
            console.error("❌ Error saving user data to Notion:", err);
            await ctx.reply(
                "❌ مشکلی در ذخیره اطلاعات پیش آمده است. لطفاً بعداً تلاش نمایید."
            );
        }
    });

    bot.hears("📝 ارسال بازخورد جلسه فنی", async (ctx) => {
        await feedbackSelect.showFeedbackSelection(ctx);
    });

    bot.hears("📚 لیست داکیومنت‌های موجود", async (ctx) => {
        await documentsList.showDocumentsList(ctx);
    });

    bot.hears("🔙 بازگشت", async (ctx) => {
        await mainMenu.showMainMenu(ctx);
    });
};
