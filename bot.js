require("dotenv").config();
const { Telegraf } = require("telegraf");
const express = require("express");
const fetch = require("node-fetch");
const createOptions = require("./createOptions");

const app = express();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const PORT = process.env.PORT;
const apiKey = process.env.PERPLEXITY_API_KEY;
const allowedGroups = process.env.ALLOWED_GROUPS.split(",").map(Number);

async function sendToPerplexity(input, apiKey) {
    try {
        const options = createOptions.createOptions(apiKey, input);
        // console.log("Perplexity options:", options);

        const res = await fetch(
            "https://api.perplexity.ai/chat/completions",
            options
        );
        const resJson = await res.json();

        let messageContent = resJson.choices[0].message.content;
        messageContent = messageContent.replace(/\[\d+\]/g, "");

        return messageContent;
    } catch (error) {
        console.error("Perplexity error:", error);
        return "❌ Error: Unable to get a response! Check Bot logs.";
    }
}
bot.on("message", async (ctx, next) => {
    const message = ctx.message;
    const text = message.text;
    const chatType = ctx.chat.type;
    const chatId = ctx.chat.id;

    const isCommand = message.entities?.some(
        (entity) => entity.type === "bot_command"
    );

    if (isCommand) {
        return next();
    }

    if (chatType !== "private" && allowedGroups.includes(chatId)) {
        if (text && text.toLowerCase().includes("#cs_internship")) {
            try {
                const processingMessage = await ctx.reply(
                    "🕒 در حال پردازش...",
                    {
                        reply_to_message_id: message.message_id,
                    }
                );

                const response = await sendToPerplexity(text, apiKey);

                await ctx.telegram.editMessageText(
                    message.chat.id,
                    processingMessage.message_id,
                    undefined,
                    response
                );
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
        ctx.reply("🤖 Bot version: 1.0.0");
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
