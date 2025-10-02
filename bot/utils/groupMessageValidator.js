const { ALLOWED_GROUPS } = require("../config");

const groupMessageValidator = (chatType, chatId, text, ctx) => {
    if (chatType !== "private" && ALLOWED_GROUPS.includes(chatId)) {
        if (text?.includes("#معرفی") || text?.includes("#no_ai")) {
            return;
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

        return false;
    }
};

module.exports = { groupMessageValidator };
