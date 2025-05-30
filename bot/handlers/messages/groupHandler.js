const { sendToPerplexity } = require("../../services/perplexity");
const { ERROR_RESPONSES } = require("../../constants/errorResponses");
const { ALLOWED_GROUPS, ADMIN_USERNAME } = require("../../config");

module.exports = (bot) => {
    bot.on("message", async (ctx, next) => {
        const message = ctx.message;
        const text = message.text;
        const chatType = ctx.chat.type;
        const chatId = ctx.chat.id;

        const isExactCommand =
            message.entities?.length === 1 &&
            message.entities[0].type === "bot_command" &&
            message.entities[0].offset === 0 &&
            message.entities[0].length === text.length;

        if (isExactCommand && chatType !== "private" && ALLOWED_GROUPS.includes(chatId)) {
            if (ctx.from?.username !== ADMIN_USERNAME) {
                try {
                    await ctx.telegram.callApi("setMessageReaction", {
                        chat_id: chatId,
                        message_id: message.message_id,
                        reaction: [{ type: "emoji", emoji: "👀" }],
                    });
                } catch (error) {
                    console.error("❌ Reaction error:", error);
                }
                return;
            } else {
                return next();
            }
        }

        if (chatType !== "private" && ALLOWED_GROUPS.includes(chatId)) {
            if (text?.includes("#معرفی") || text?.includes("#no_ai")) return;

            if (text?.toLowerCase().includes("#cs_internship")) {
                try {
                    const processingMessage = await ctx.reply("🕒 در حال پردازش...", {
                        reply_to_message_id: message.message_id,
                    });

                    let response = await sendToPerplexity(text);

                    const errorEntry = Object.values(ERROR_RESPONSES).find(
                        (entry) => entry.code === response
                    );

                    response +=
                        "\n\nتوضیح نحوه ساخت پیام:\n\nhttps://t.me/cs_internship/729";

                    await ctx.telegram.editMessageText(
                        chatId,
                        processingMessage.message_id,
                        undefined,
                        errorEntry ? errorEntry.message : response,
                        {
                            disable_web_page_preview: true,
                        }
                    );
                } catch (error) {
                    console.error("❌ Error processing message:", error);
                    await ctx.reply("❌ مشکلی پیش اومد.");
                }
            }

            return;
        }

        if (chatType === "private") {
            return next();
        }

        console.log("⛔ Unauthorized chat:");
        console.log("Chat ID:", chatId);
        console.log("Chat Title:", ctx.chat.title || "N/A");
        console.log("User ID:", ctx.from?.id);
        console.log("Username:", ctx.from?.username || "N/A");
        console.log("-------------------------");
    });
};