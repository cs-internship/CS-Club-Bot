import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("../.env") });

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const link = process.env.SNEAKY_REACTION_LINK;

const REACTIONS_OBJ = {
    1: "🎉",
    2: "❤️",
    3: "👍",
    4: "😍",
    5: "😎",
    6: "😭",
    7: "🤣",
    8: "👏",
    9: "🙏",
    10: "👌",
    11: "🤔",
    12: "👀",
    13: "😢",
    14: "💔",
    15: "🔥",
    16: "🤩",
    17: "🤓",
    18: "🐋",
    19: "🤝",
    20: "👾",
    21: "🫡",
    22: "🦄",
    23: "🤷‍♂️",
    24: "💅",
    25: "⚡",
};

// Configuration
const SELECTED = 25;
const ADD_REACTION = true; // true to add, false to remove

function parseTelegramLink(link) {
    const match = link.match(/t\.me\/c\/(\d+)\/(\d+)/);
    if (!match) throw new Error("Invalid Telegram link format");
    const channelId = match[1];
    const messageId = parseInt(match[2], 10);
    const chatId = "-100" + channelId;
    return { chatId, messageId };
}

async function handleReaction(link, emoji, add = true) {
    const { chatId, messageId } = parseTelegramLink(link);

    await bot.telegram.callApi("setMessageReaction", {
        chat_id: chatId,
        message_id: messageId,
        type: "emoji",
        emoji: emoji,
        remove: !add,
    });

    console.log(`Reaction ${emoji} ${add ? "added" : "removed"} successfully.`);
    process.exit(0);
}

await handleReaction(link, REACTIONS_OBJ[SELECTED], ADD_REACTION);
