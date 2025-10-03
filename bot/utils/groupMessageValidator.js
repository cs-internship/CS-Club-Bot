const { ALLOWED_GROUPS, ADMIN_CHAT_ID } = require("../config");

const groupMessageValidator = async (chatType, chatId, text, ctx) => {
    if (chatType === "private") {
        return false;
    }

    if (ALLOWED_GROUPS.includes(chatId)) {
        if (text?.includes("#معرفی") || text?.includes("#no_ai")) {
            return false;
        }
        if (text?.toLowerCase().includes("#cs_internship")) {
            // if (text?.toLowerCase().includes("#test")) {
            return true;
        }
        return false;
    } else {
        console.log("⛔ Unauthorized chat:");
        console.log("Chat ID:", chatId);
        console.log("Chat Title:", ctx.chat.title || "N/A");
        console.log("User ID:", ctx.from?.id);
        console.log("Username:", ctx.from?.username || "N/A");
        console.log("-------------------------");

        await ctx.telegram.sendMessage(
            ADMIN_CHAT_ID,
            `⛔ <b>Unauthorized chat detected!</b>\n\n` +
                `Chat ID: <code>${chatId}</code>\n` +
                `Chat Title: ${ctx.chat.title || "N/A"}\n` +
                `User ID: <code>${ctx.from?.id}</code>\n` +
                `Username: @${ctx.from?.username || "N/A"}` +
                `\n\nMessage:\n${
                    text ? `<code>${text}</code>` : "<i>No text content</i>"
                }`,
            {
                parse_mode: "HTML",
            }
        );

        return false;
    }
};

module.exports = { groupMessageValidator };
