require("dotenv").config();
const { Telegraf } = require("telegraf");
const express = require("express");
const axios = require("axios");

const createOptions = require("./createOptions");

const app = express();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const PORT = process.env.PORT;

async function sendToPerplexity(input, apiKey) {
    try {
        const options = createOptions.createOptions(apiKey, input);

        console.log("Perplexity options:", options);

        const res = await fetch(
            "https://api.perplexity.ai/chat/completions",
            options
        );

        const resJson = await res.json();
        console.log("RES >>", resJson.choices[0].message.content);

        let messageContent = resJson.choices[0].message.content;
        messageContent = messageContent.replace(/\[\d+\]/g, "");

        return messageContent;
    } catch (error) {
        console.log("Perplexity error:", error);
        return "Error: Unable to get a response from Perplexity AI.";
    }
}

bot.start((ctx) => {
    ctx.reply("Aloha :)");
});

bot.on("text", async (ctx) => {
    const userInput = ctx.message.text;
    const apiKey = process.env.PERPLEXITY_API_KEY;

    await ctx.reply("🕐 در حال پرسیدن...");

    const answer = await sendToPerplexity(userInput, apiKey);

    await ctx.reply(answer);
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
