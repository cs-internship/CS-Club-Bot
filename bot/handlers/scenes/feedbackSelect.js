const { Client } = require("@notionhq/client");
const NOTION_API_KEY = new Client({ auth: process.env.NOTION_API_KEY });
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

module.exports = {
    async showFeedbackSelection(ctx) {
        try {
            const response = await NOTION_API_KEY.databases.query({
                database_id: NOTION_DATABASE_ID,
            });

            const users = response.results
                .map((page) => {
                    const name =
                        page.properties["Full Name"]?.title?.[0]?.text
                            ?.content || null;
                    return name;
                })
                .filter(Boolean);

            if (users.length === 0) {
                return ctx.reply("❗ هنوز هیچ کاربری ثبت نشده است.");
            }

            const keyboard = [];
            for (let i = 0; i < users.length; i += 2) {
                const row = [{ text: users[i] }];
                if (users[i + 1]) row.push({ text: users[i + 1] });
                keyboard.push(row);
            }

            keyboard.push([{ text: "🔙 بازگشت" }]);

            await ctx.reply("👤 لطفاً یک همیار فنی را برای ارسال بازخورد انتخاب نمایید:", {
                reply_markup: {
                    keyboard,
                    resize_keyboard: true,
                    is_persistent: true,
                    input_field_placeholder: "انتخاب همیار فنی",
                },
            });
        } catch (err) {
            console.error("❌ Error fetching users from Notion:", err);
            await ctx.reply(
                "❌ مشکلی در دریافت اطلاعات کاربران پیش آمده است. لطفاً بعداً تلاش نمایید."
            );
        }
    },
};
