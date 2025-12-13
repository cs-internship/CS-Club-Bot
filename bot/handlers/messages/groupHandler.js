const { ALLOWED_GROUPS, ADMIN_USERNAME } = require("../../config");
const { ERROR_RESPONSES } = require("../../constants/errorResponses");
const { sendToPerplexity } = require("../../services/perplexity");
const { escapeHtml } = require("../../utils/escapeHtml");
const {
    formatGroupMessage,
    formatGroupMessageChunks,
} = require("../../utils/formatGroupMessage");
const { groupMessageValidator } = require("../../utils/groupMessageValidator");
const { safeChunkText } = require("../../utils/safeChunkText");

const mediaGroupCache = new Map();

// Fallback chunker for environments/tests that mock formatGroupMessageChunks
const buildChunks = (response, limit = 4000) => {
    if (typeof formatGroupMessageChunks === "function") {
        return formatGroupMessageChunks(response, limit);
    }

    return safeChunkText(formatGroupMessage(response), limit);
};

module.exports = (bot) => {
    bot.on("message", async (ctx, next) => {
        const message = ctx.message;
        const chatType = ctx.chat.type;
        const chatId = ctx.chat.id;

        const entities = message.entities || message.caption_entities;
        const text = message.caption || message.text;

        const photoFileIds = [];

        // console.log("Message >>", message);

        if (message.photo) {
            const largePhoto = message.photo[message.photo.length - 1];
            if (largePhoto?.file_id) {
                photoFileIds.push(largePhoto.file_id);
            }
        }

        if (message.media_group_id) {
            const groupId = message.media_group_id;
            const compositeKey = `${chatId}:${groupId}`;

            if (!mediaGroupCache.has(compositeKey)) {
                mediaGroupCache.set(compositeKey, {
                    text: "",
                    photoFileIds: [],
                    isProcessing: false,
                    timeout: null,
                });
            }
            const groupData = mediaGroupCache.get(compositeKey);

            if (text) {
                groupData.text = text;
            }
            groupData.photoFileIds.push(...photoFileIds);

            if (groupData.timeout) clearTimeout(groupData.timeout);

            groupData.timeout = setTimeout(async () => {
                if (groupData.isProcessing) return;
                groupData.isProcessing = true;

                try {
                    await processMessage(
                        ctx.telegram,
                        groupData.text,
                        groupData.photoFileIds,
                        chatId,
                        message.message_id,
                        chatType,
                        ctx
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
                await next();
            }
        }

        if (await groupMessageValidator(chatType, chatId, text, ctx)) {
            try {
                const processingMessage = await ctx.telegram.sendMessage(
                    chatId,
                    "🕒 در حال پردازش...",
                    { reply_to_message_id: message.message_id }
                );

                const response = await sendToPerplexity(
                    text,
                    photoFileIds,
                    ctx.telegram
                );
                // let response = "test";
                // const response = "<b>test</b> 📊" + "w".repeat(5000);

                // console.log("Perplexity response >>", response);

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
                    const chunks = buildChunks(response, 4000);

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

        if (chatType === "private") {
            await next();
        }
    });
};

const processMessage = async (
    telegramClient,
    text,
    photoFileIds,
    chatId,
    replyToMessageId,
    chatType,
    ctx
) => {
    if (await groupMessageValidator(chatType, chatId, text, ctx)) {
        const processingMessage = await telegramClient.sendMessage(
            chatId,
            "🕒 در حال پردازش...",
            {
                reply_to_message_id: replyToMessageId,
            }
        );

        try {
            const response = await sendToPerplexity(
                text,
                photoFileIds,
                telegramClient
            );
            // let response = "test";

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

            const finalMessage = formatGroupMessage(response);
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
    }
};

// Export internal helper for unit tests (defined after function)
module.exports._processMessage = processMessage;
