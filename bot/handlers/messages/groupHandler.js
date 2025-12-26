const fetch = require("node-fetch");

const {
    ALLOWED_GROUPS,
    ADMIN_USERNAME,
    TELEGRAM_BOT_TOKEN,
} = require("../../config");
const { ERROR_RESPONSES } = require("../../constants/errorResponses");
const { sendToPerplexity } = require("../../services/perplexity");
const { convertENtoFA } = require("../../utils/convertENtoFA");
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

        const photoUrls = [];

        // console.log("Message >>", message);

        if (message.photo) {
            const largePhoto = message.photo[message.photo.length - 1];

            try {
                const file = await ctx.telegram.getFile(largePhoto.file_id);
                const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;

                const res = await fetch(fileUrl);
                if (!res.ok) {
                    throw new Error("Failed to download image from Telegram");
                }

                const buffer = await res.buffer();

                let mime = "image/jpeg";
                if (file.file_path.endsWith(".png")) mime = "image/png";
                else if (file.file_path.endsWith(".webp")) mime = "image/webp";

                const base64 = buffer.toString("base64");
                const dataUri = `data:${mime};base64,${base64}`;

                photoUrls.push(dataUri);
            } catch (err) {
                console.error(
                    "❌ Error getting or converting image:",
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
                if (groupData.isProcessing) {
                    return;
                }
                groupData.isProcessing = true;

                try {
                    await processMessage(
                        ctx.telegram,
                        groupData.text,
                        groupData.photos,
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

        await processMessage(
            ctx.telegram,
            text,
            photoUrls,
            chatId,
            message.message_id,
            chatType,
            ctx,
            {
                replyChunksTo: "processing",
                fallbackReplyMode: "ctx",
            }
        );

        if (chatType === "private") {
            await next();
        }
    });
};

const processMessage = async (
    telegramClient,
    text,
    photoUrls,
    chatId,
    replyToMessageId,
    chatType,
    ctx,
    options = {}
) => {
    const { replyChunksTo = "original", fallbackReplyMode = "telegram" } =
        options;

    if (await groupMessageValidator(chatType, chatId, text, ctx)) {
        try {
            const processingMessage = await telegramClient.sendMessage(
                chatId,
                "🕒 در حال پردازش...",
                {
                    reply_to_message_id: replyToMessageId,
                }
            );

            const rawResponse = await sendToPerplexity(text, photoUrls);
            // let rawResponse = "test";
            // const rawResponse = "<b>test</b> 📊" + "w".repeat(50);

            const response = convertENtoFA(rawResponse);

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

            const chunks = buildChunks(response, 4000);

            console.log("Response Chunks >>", chunks);

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

            const replyToForExtraChunks =
                replyChunksTo === "processing"
                    ? processingMessage.message_id
                    : replyToMessageId;

            for (let i = 1; i < chunks.length; i++) {
                await telegramClient.sendMessage(chatId, chunks[i], {
                    parse_mode: "HTML",
                    disable_web_page_preview: true,
                    reply_to_message_id: replyToForExtraChunks,
                });
            }
        } catch (error) {
            console.error(
                "❌ Error processing message:",
                error && error.stack ? error.stack : error
            );

            try {
                if (fallbackReplyMode === "ctx" && ctx?.reply) {
                    await ctx.reply("❌ مشکلی پیش اومد.");
                } else {
                    await telegramClient.sendMessage(
                        chatId,
                        "❌ مشکلی پیش اومد.",
                        {
                            reply_to_message_id: replyToMessageId,
                        }
                    );
                }
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
