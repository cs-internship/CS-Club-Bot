require("dotenv").config();
const CryptoJS = require("crypto-js");
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

    if (
        isExactCommand &&
        chatType !== "private" &&
        allowedGroups.includes(chatId)
    ) {
        if (ctx.from?.username !== adminUsername) {
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

    if (chatType !== "private" && allowedGroups.includes(chatId)) {
        if (text?.includes("#معرفی") || text?.includes("#no_ai")) return;

        if (text?.toLowerCase().includes("#cs_internship")) {
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

// Get Feedback Link - v1.1.6+

bot.start(async (ctx) => {
    if (ctx.chat.type !== "private") return;

    const firstName = ctx.from?.first_name || "";
    const lastName = ctx.from?.last_name || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    await ctx.reply(
        `سلام ${fullName}\n\nبرای استفاده از امکانات بات، یکی از گزینه‌های زیر را انتخاب کنید.`,
        {
            reply_markup: {
                keyboard: [
                    [{ text: "📝 دریافت لینک ارسال بازخورد" }],
                    [{ text: "📝 دریافت لینک پروفایل بازخوردها" }],
                ],
                resize_keyboard: true,
                input_field_placeholder: "یک گزینه رو انتخاب کن",
                is_persistent: true,
            },
        }
    );
});

bot.hears("📝 دریافت لینک ارسال بازخورد", async (ctx) => {
    try {
        const username = ctx.from?.username;
        if (!username) {
            return ctx.reply(
                "❌ یوزرنیم شما وجود ندارد. لطفاً ابتدا در تنظیمات تلگرام برای خود یک username تعریف کنید."
            );
        }

        const specialFN = process.env.USERNAME_SPECIAL_FN;
        const stringFunction = eval(specialFN);
        const specialUsername = stringFunction(username);

        const encryptionKey = process.env.ENCRYPTION_KEY;

        const encrypted = CryptoJS.AES.encrypt(
            specialUsername,
            encryptionKey
        ).toString();

        const feedbackUrl = `https://tally.so/r/mOy7j7?form=${encodeURIComponent(
            encrypted
        )}`;

        await ctx.reply(
            `📝 *لینک اختصاصی ثبت بازخورد شما آماده است!*\n\n` +
                `این لینک برای ثبت بازخورد با *نام کاربری شما* ساخته شده است.\n\n` +
                `⚠️ درصورتی که تغییری در آدرس ایجاد شود، لینک اشتباه حساب می‌شود و بازخورد شما ارسال نخواهد شد.\n\n` +
                `📎 لینک اختصاصی شما:\n${feedbackUrl}`,
            {
                parse_mode: "Markdown",
                disable_web_page_preview: true,
            }
        );
    } catch (error) {
        console.error("❌ Error in feedback link generation:", error);
        await ctx.reply("❌ مشکلی در ساخت لینک بازخورد پیش آمد.");
    }
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
