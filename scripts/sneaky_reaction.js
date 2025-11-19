import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import path from "path";
import { REACTIONS_OBJ } from "./reaction_constants.js";

dotenv.config({ path: path.resolve("../.env") });

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const link = process.env.SNEAKY_REACTION_LINK;

// Configuration
const SELECTED = 13;
const ADD_REACTION = true; // false = Remove reaction | true = Add reaction

function parseTelegramLink(link) {
    const match = link.match(/t\.me\/c\/(\d+)\/(\d+)/);
    if (!match) throw new Error("Invalid Telegram link format");

    const channelId = match[1];
    const messageId = parseInt(match[2], 10);

    return {
        chatId: "-100" + channelId,
        messageId,
    };
}

async function handleReaction(link, emoji, add = true) {
    const { chatId, messageId } = parseTelegramLink(link);

    await bot.telegram.callApi("setMessageReaction", {
        chat_id: chatId,
        message_id: messageId,
        reaction: add ? [{ type: "emoji", emoji }] : [],
        is_big: false,
    });

    console.log(`Reaction ${emoji} ${add ? "added" : "removed"} successfully.`);
    process.exit(0);
}

await handleReaction(link, REACTIONS_OBJ[SELECTED], ADD_REACTION);
