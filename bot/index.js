const express = require("express");
const bot = require("./bot");
const { PORT } = require("./config");

const app = express();

app.get("/", (_, res) => res.send("🤖 Telegram bot is running."));

app.listen(PORT, () => {
    console.log(`🚀 Express running on port ${PORT}`);
    bot.launch().then(() => {
        console.log("🤖 Telegram bot launched");
    });
});

// graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// error handling
process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
});
