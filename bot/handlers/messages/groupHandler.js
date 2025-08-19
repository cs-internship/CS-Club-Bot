const { sendToPerplexity } = require("../../services/perplexity");
const { ERROR_RESPONSES } = require("../../constants/errorResponses");
const {
    ALLOWED_GROUPS,
    ADMIN_USERNAME,
    TELEGRAM_BOT_TOKEN,
} = require("../../config");

const mediaGroupCache = new Map();

module.exports = (bot) => {
    bot.on("message", async (ctx, next) => {
        const message = ctx.message;
        const chatType = ctx.chat.type;
        const chatId = ctx.chat.id;

        const text = message.caption || message.text;

        let photoUrls = [];

        if (message.photo) {
            const middleIndex = Math.floor(message.photo.length / 2);
            const mediumPhoto = message.photo[middleIndex];
            const file = await ctx.telegram.getFile(mediumPhoto.file_id);
            const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;
            photoUrls.push(fileUrl);
        }

        // console.log("📎 Telegram File URLs:", photoUrls);
        // console.log("MESSAGE >> ", message);

        if (message.media_group_id) {
            const groupId = message.media_group_id;

            if (!mediaGroupCache.has(groupId)) {
                mediaGroupCache.set(groupId, { text: "", photos: [] });
            }
            const groupData = mediaGroupCache.get(groupId);

            if (text) {
                groupData.text = text;
            }
            groupData.photos.push(...photoUrls);

            clearTimeout(groupData.timeout);

            groupData.timeout = setTimeout(async () => {
                try {
                    await processMessage(
                        ctx,
                        groupData.text,
                        groupData.photos,
                        chatId,
                        message.message_id
                    );
                } catch (err) {
                    console.error("❌ Error processing media group:", err);
                } finally {
                    mediaGroupCache.delete(groupId);
                }
            }, 500);

            return;
        }

        const isExactCommand =
            message.entities?.length === 1 &&
            message.entities[0].type === "bot_command" &&
            message.entities[0].offset === 0 &&
            message.entities[0].length === text?.length;

        if (
            isExactCommand &&
            chatType !== "private" &&
            ALLOWED_GROUPS.includes(chatId)
        ) {
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
            if (text?.includes("#معرفی") || text?.includes("#no_ai")) {
                return;
            }

            if (
                text?.toLowerCase().includes("#test") ||
                text?.toLowerCase().includes("#cs_internship")
            ) {
                try {
                    const processingMessage = await ctx.reply(
                        "🕒 در حال پردازش...",
                        { reply_to_message_id: message.message_id }
                    );

                    let response = await sendToPerplexity(text, photoUrls);

                    const errorEntry = Object.values(ERROR_RESPONSES).find(
                        (entry) => entry.code === response
                    );

                    const explanationLink =
                        "\n\nتوضیح نحوه ساخت پیام:\n\nhttps://t.me/cs_internship/729";

                    let finalMessage = "";

                    if (response.includes("📊")) {
                        const [firstPart, secondPart] = response.split("📊");

                        finalMessage = `${firstPart.trim()}

📊 <b>برای دیدن ادامه کلیک کنید:</b>
<blockquote expandable>${secondPart.trim()}${explanationLink}</blockquote>`;
                    } else {
                        finalMessage = `${response}${explanationLink}`;
                    }

                    await ctx.telegram.editMessageText(
                        chatId,
                        processingMessage.message_id,
                        undefined,
                        errorEntry ? errorEntry.message : finalMessage,
                        {
                            parse_mode: "HTML",
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

async function processMessage(ctx, text, photoUrls, chatId, replyToMessageId) {
    const processingMessage = await ctx.reply("🕒 در حال پردازش...", {
        reply_to_message_id: replyToMessageId,
    });

    try {
        const response = await sendToPerplexity(text, photoUrls);

        const errorEntry = Object.values(ERROR_RESPONSES).find(
            (entry) => entry.code === response
        );

        const explanationLink =
            "\n\nتوضیح نحوه ساخت پیام:\n\nhttps://t.me/cs_internship/729";

        let finalMessage = "";

        if (response.includes("📊")) {
            const [firstPart, secondPart] = response.split("📊");

            finalMessage = `${firstPart.trim()}

📊 <b>برای دیدن ادامه کلیک کنید:</b>
<blockquote expandable>${secondPart.trim()}${explanationLink}</blockquote>`;
        } else {
            finalMessage = `${response}${explanationLink}`;
        }

        await ctx.telegram.editMessageText(
            chatId,
            processingMessage.message_id,
            undefined,
            errorEntry ? errorEntry.message : finalMessage,
            {
                parse_mode: "HTML",
                disable_web_page_preview: true,
            }
        );
    } catch (error) {
        console.error("❌ Error processing message:", error);
        await ctx.reply("❌ مشکلی پیش اومد.");
    }
}
