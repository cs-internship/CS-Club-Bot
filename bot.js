require("dotenv").config();
const { Telegraf } = require("telegraf");
const { version } = require("./package.json");
const { ERROR_RESPONSES } = require("./error-responses");

const express = require("express");
const fetch = require("node-fetch");
const createOptions = require("./createOptions");

const app = express();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const PORT = process.env.PORT;
const apiKey = process.env.PERPLEXITY_API_KEY;
const allowedGroups = process.env.ALLOWED_GROUPS.split(",").map(Number);

async function sendToPerplexity(input) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    try {
        const options = {
            ...createOptions.createOptions(apiKey, input),
            signal: controller.signal,
        };

        const res = await fetch(
            "https://api.perplexity.ai/chat/completions",
            options
        );

        if (!res.ok) {
            const status = res.status;
            const body = await res.text();

            console.error("❌ Perplexity API Error", status, body);

            switch (status) {
                case 403:
                    return ERROR_RESPONSES.FORBIDDEN.code;
                case 429:
                    return ERROR_RESPONSES.RATE_LIMIT.code;
                case 500:
                    return ERROR_RESPONSES.SERVER_ERROR.code;
                default:
                    return ERROR_RESPONSES.UNKNOWN.code;
            }
        }

        const resJson = await res.json();
        let messageContent = resJson.choices[0].message.content;
        messageContent = messageContent.replace(/\[\d+\]/g, "");

        return messageContent;
    } catch (error) {
        if (error.name === "AbortError") {
            console.error("❌ Request to Perplexity timed out.");
            return ERROR_RESPONSES.TIMEOUT.code;
        }

        console.error("❌ Exception in sendToPerplexity:", error);
        return ERROR_RESPONSES.EXCEPTION.code;
    } finally {
        clearTimeout(timeout);
    }
}

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

    if (isExactCommand) {
        if (ctx.from?.username !== process.env.ADMIN_USERNAME) {
            try {
                await ctx.telegram.callApi("setMessageReaction", {
                    chat_id: ctx.chat.id,
                    message_id: message.message_id,
                    reaction: [{ type: "emoji", emoji: "👀" }],
                });
            } catch (error) {
                console.error("Reaction error:", error);
            }
            return;
        }
        return next();
    }

    if (chatType !== "private" && allowedGroups.includes(chatId)) {
        if (
            (text && text.includes("#معرفی")) ||
            (text && text.includes("#no_ai"))
        ) {
            return;
        }

        if (text && text.toLowerCase().includes("#cs_internship")) {
            try {
                const processingMessage = await ctx.reply(
                    "🕒 در حال پردازش...",
                    {
                        reply_to_message_id: message.message_id,
                    }
                );

                let response = await sendToPerplexity(text);

                const errorEntry = Object.values(ERROR_RESPONSES).find(
                    (entry) => entry.code === response
                );

                response +=
                    "\n\nتوضیح نحوه ساخت پیام:\n\nhttps://t.me/cs_internship/729";

                if (errorEntry) {
                    await ctx.telegram.editMessageText(
                        message.chat.id,
                        processingMessage.message_id,
                        undefined,
                        errorEntry.message
                    );
                } else {
                    await ctx.telegram.editMessageText(
                        message.chat.id,
                        processingMessage.message_id,
                        undefined,
                        response,
                        {
                            disable_web_page_preview: true,
                        }
                    );
                }
            } catch (error) {
                console.error("Error processing message:", error);
                await ctx.reply("❌ مشکلی پیش اومد.");
            }
        }
    } else {
        console.log("⛔ Unauthorized chat:");
        console.log("Chat ID:", chatId);
        console.log("Chat Title:", ctx.chat.title || "N/A");
        console.log("User ID:", ctx.from?.id);
        console.log("Username:", ctx.from?.username || "N/A");
        console.log("-------------------------");
    }
});

bot.command("Version", (ctx) => {
    const chatId = ctx.chat.id;
    const chatType = ctx.chat.type;

    if (chatType !== "private" && allowedGroups.includes(chatId)) {
        ctx.reply(`🤖 Bot version: ${version}`);
    }
});

bot.command("group_id", (ctx) => {
    ctx.reply(`🤖 Group ID: ${ctx.chat.id}`);
});

app.get("/", (req, res) => {
    res.send("🤖 Telegram bot is running.");
});

app.listen(PORT, () => {
    console.log(`🚀 Express running on port ${PORT}`);
});

bot.launch().then(() => {
    console.log("🤖 Telegram bot launched");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
