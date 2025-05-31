const { Client } = require("@notionhq/client");
const mainMenu = require("../scenes/mainMenu");
require("dotenv").config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

module.exports = (bot) => {
    bot.on("text", async (ctx, next) => {
        if (
            ctx.chat.type !== "private" ||
            !ctx.session ||
            ctx.session.registered
        ) {
            return next();
        }

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
                    "Registration Date": { date: { start: userData.date } },
                },
            });

            ctx.session.registered = true;

            await ctx.reply(
                `✅ اطلاعات شما با موفقیت ثبت شد ${fullNameInput}.`
            );

            await mainMenu.showMainMenu(ctx);
        } catch (err) {
            console.error("❌ Error saving user data to Notion:", err);
            await ctx.reply(
                "❌ مشکلی در ذخیره اطلاعات پیش آمده است. لطفاً بعداً تلاش نمایید."
            );
        }
    });
};
