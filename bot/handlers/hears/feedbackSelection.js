const { Client } = require("@notionhq/client");
const { getRoleByUsername } = require("../../utils/getRoleByUsername");
const NOTION_API_KEY = new Client({ auth: process.env.NOTION_API_KEY });
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

module.exports = (bot) => {
    bot.hears("📝 ارسال بازخورد جلسه فنی", async (ctx) => {
        const loadingMessage = await ctx.reply(
            "🔄 در حال دریافت لیست همیاران فنی...",
            {
                reply_markup: {
                    remove_keyboard: true,
                },
            }
        );
        ctx.session.loadingMessageId = loadingMessage.message_id;

        try {
            const response = await NOTION_API_KEY.databases.query({
                database_id: NOTION_DATABASE_ID,
            });

            const role = await getRoleByUsername(ctx.from.username);

            if (!role) {
                return ctx.reply(
                    "❗ خطا در دریافت دوره شما. لطفاً بعداً تلاش کنید."
                );
            }

            const users = response.results
                .map((page) => {
                    const name =
                        page.properties["Full Name"]?.title?.[0]?.text
                            ?.content || null;

                    if (page.properties["isHidden"]?.checkbox) {
                        return null;
                    }

                    if (
                        role ===
                        page.properties["Role"]?.multi_select?.[0]?.name
                    ) {
                        return name;
                    }
                })
                .filter(Boolean);

            if (users.length === 0) {
                return ctx.reply("❗ هنوز هیچ کاربری ثبت نشده است.");
            }

            const keyboard = [];
            for (let i = 0; i < users.length; i++) {
                const row = [{ text: users[i] }];
                // if (users[i + 1]) row.push({ text: users[i + 1] });
                keyboard.push(row);
            }

            keyboard.push([{ text: "🔙 بازگشت" }]);

            ctx.session.availableUsers = users;
            ctx.session.step = "awaiting_user_selection";

            if (ctx.session.loadingMessageId) {
                try {
                    await ctx.deleteMessage(ctx.session.loadingMessageId);
                    ctx.session.loadingMessageId = null;
                } catch (err) {
                    console.warn("❗ Error deleting loading message:", err);
                }
            }

            await ctx.reply(
                "👤 لطفاً یک همیار فنی را برای ارسال بازخورد انتخاب نمایید:\n\n" +
                    "دوره انتخابی: " +
                    (role || "نامشخص"),
                {
                    reply_markup: {
                        keyboard,
                        resize_keyboard: true,
                        is_persistent: true,
                        input_field_placeholder: "انتخاب همیار فنی",
                    },
                }
            );
        } catch (err) {
            console.error("❌ Error fetching users from Notion:", err);
            await ctx.reply(
                "❌ مشکلی در دریافت اطلاعات کاربران پیش آمده است. لطفاً بعداً تلاش نمایید."
            );
        }
    });
};
