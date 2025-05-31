const express = require("express");
const bot = require("./bot");
const { PORT } = require("./bot/config");

const app = express();

// Health check route
app.get("/", (_, res) => res.send("🤖 Telegram bot is running."));

app.listen(PORT, () => {
    console.log(`🚀 Express running on port ${PORT}`);
    bot.launch()
        .then(() => console.log("🤖 Telegram bot launched"))
        .catch((err) => console.error("❌ Error launching bot:", err));
});

// Graceful shutdown
process.once("SIGINT", () => {
    console.log("🛑 SIGINT received. Stopping bot...");
    bot.stop("SIGINT");
});
process.once("SIGTERM", () => {
    console.log("🛑 SIGTERM received. Stopping bot...");
    bot.stop("SIGTERM");
});

// Error handling
process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
});
