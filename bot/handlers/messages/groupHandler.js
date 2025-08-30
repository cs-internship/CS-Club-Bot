const { sendToPerplexity } = require("../../services/perplexity");
const { ERROR_RESPONSES } = require("../../constants/errorResponses");
const { safeChunkText } = require("../../utils/safeChunkText");
const { escapeHtml } = require("../../utils/escapeHtml");
const {
    ALLOWED_GROUPS,
    ADMIN_USERNAME,
    TELEGRAM_BOT_TOKEN,
} = require("../../config");

const mediaGroupCache = new Map();

const formatFinalMessage = (response) => {
    const explanationLink =
        "\n\nتوضیح نحوه ساخت پیام:\n\nhttps://t.me/cs_internship/729";
    const respStr =
        typeof response === "string" ? response : String(response || "");

    if (respStr.includes("📊")) {
        const [firstPart, secondPart] = respStr.split("📊");
        return `${escapeHtml(firstPart.trim())}

📊 <b>برای دیدن ادامه کلیک کنید:</b>
<blockquote expandable>${escapeHtml(secondPart.trim())}${escapeHtml(
            explanationLink
        )}</blockquote>`;
    }

    return escapeHtml(respStr) + escapeHtml(explanationLink);
};

module.exports = (bot) => {
    bot.on("message", async (ctx, next) => {
        const message = ctx.message;
        const chatType = ctx.chat.type;
        const chatId = ctx.chat.id;

        const entities = message.entities || message.caption_entities;
        const text = message.caption || message.text;

        let photoUrls = [];

        if (message.photo) {
            const largePhoto = message.photo[message.photo.length - 1];
            try {
                const file = await ctx.telegram.getFile(largePhoto.file_id);
                const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;
                photoUrls.push(fileUrl);
            } catch (err) {
                console.error(
                    "❌ Error getting file:",
                    err && err.stack ? err.stack : err
                );
            }
        }

        if (message.media_group_id) {
            const groupId = message.media_group_id;
            const compositeKey = `${chatId}:${groupId}`;

            if (!mediaGroupCache.has(compositeKey)) {
                mediaGroupCache.set(compositeKey, {
                    text: "",
                    photos: [],
                    isProcessing: false,
                    timeout: null,
                });
            }
            const groupData = mediaGroupCache.get(compositeKey);

            if (text) {
                groupData.text = text;
            }
            groupData.photos.push(...photoUrls);

            if (groupData.timeout) clearTimeout(groupData.timeout);

            groupData.timeout = setTimeout(async () => {
                if (groupData.isProcessing) return;
                groupData.isProcessing = true;

                try {
                    await processMessage(
                        ctx.telegram,
                        groupData.text,
                        groupData.photos,
                        chatId,
                        message.message_id
                    );
                } catch (err) {
                    console.error(
                        "❌ Error processing media group:",
                        err && err.stack ? err.stack : err
                    );
                } finally {
                    mediaGroupCache.delete(compositeKey);
                }
            }, 700);

            return;
        }

        const isExactCommand =
            entities?.length === 1 &&
            entities[0].type === "bot_command" &&
            entities[0].offset === 0 &&
            entities[0].length === text?.length;

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
                    console.error(
                        "❌ Reaction error:",
                        error && error.stack ? error.stack : error
                    );
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

            if (text?.toLowerCase().includes("#cs_internship")) {
                try {
                    const processingMessage = await ctx.telegram.sendMessage(
                        chatId,
                        "🕒 در حال پردازش...",
                        { reply_to_message_id: message.message_id }
                    );

                    let response = await sendToPerplexity(text, photoUrls);

                    const errorEntry = Object.values(ERROR_RESPONSES).find(
                        (entry) =>
                            entry.code === response ||
                            entry.code === String(response)
                    );

                    if (errorEntry) {
                        await ctx.telegram.editMessageText(
                            chatId,
                            processingMessage.message_id,
                            undefined,
                            escapeHtml(errorEntry.message),
                            {
                                parse_mode: "HTML",
                                disable_web_page_preview: true,
                            }
                        );
                    } else {
                        const finalMessage = formatFinalMessage(response);
                        const chunks = safeChunkText(finalMessage, 4000);

                        await ctx.telegram.editMessageText(
                            chatId,
                            processingMessage.message_id,
                            undefined,
                            chunks[0],
                            {
                                parse_mode: "HTML",
                                disable_web_page_preview: true,
                            }
                        );

                        for (let i = 1; i < chunks.length; i++) {
                            await ctx.telegram.sendMessage(chatId, chunks[i], {
                                parse_mode: "HTML",
                                disable_web_page_preview: true,
                                reply_to_message_id: message.message_id,
                            });
                        }
                    }
                } catch (error) {
                    console.error(
                        "❌ Error processing message:",
                        error && error.stack ? error.stack : error
                    );
                    try {
                        await ctx.reply("❌ مشکلی پیش اومد.");
                    } catch (e) {
                        console.error(
                            "❌ Error sending fallback reply:",
                            e && e.stack ? e.stack : e
                        );
                    }
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

const processMessage = async (
    telegramClient,
    text,
    photoUrls,
    chatId,
    replyToMessageId
) => {
    if (text?.includes("#no_ai") || text?.includes("#معرفی")) {
        return;
    }

    const processingMessage = await telegramClient.sendMessage(
        chatId,
        "🕒 در حال پردازش...",
        {
            reply_to_message_id: replyToMessageId,
        }
    );

    try {
        const response = await sendToPerplexity(text, photoUrls);

        const errorEntry = Object.values(ERROR_RESPONSES).find(
            (entry) =>
                entry.code === response || entry.code === String(response)
        );

        if (errorEntry) {
            await telegramClient.editMessageText(
                chatId,
                processingMessage.message_id,
                undefined,
                escapeHtml(errorEntry.message),
                {
                    parse_mode: "HTML",
                    disable_web_page_preview: true,
                }
            );
            return;
        }

        const finalMessage = formatFinalMessage(response);
        const chunks = safeChunkText(finalMessage, 4000);

        await telegramClient.editMessageText(
            chatId,
            processingMessage.message_id,
            undefined,
            chunks[0],
            {
                parse_mode: "HTML",
                disable_web_page_preview: true,
            }
        );
        for (let i = 1; i < chunks.length; i++) {
            await telegramClient.sendMessage(chatId, chunks[i], {
                parse_mode: "HTML",
                disable_web_page_preview: true,
                reply_to_message_id: replyToMessageId,
            });
        }
    } catch (error) {
        console.error(
            "❌ Error processing message:",
            error && error.stack ? error.stack : error
        );
        try {
            await telegramClient.sendMessage(chatId, "❌ مشکلی پیش اومد.", {
                reply_to_message_id: replyToMessageId,
            });
        } catch (e) {
            console.error(
                "❌ Error sending fallback reply:",
                e && e.stack ? e.stack : e
            );
        }
    }
};
