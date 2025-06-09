require("dotenv").config();

module.exports = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    PORT: process.env.PORT || 3000,
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    USERNAME_SPECIAL_FN: process.env.USERNAME_SPECIAL_FN,
    ALLOWED_GROUPS: (process.env.ALLOWED_GROUPS || "")
        .split(",")
        .map(Number)
        .filter(Boolean),
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    FORM_BASE_URL: "https://tally.so/r/mOy7j7",
    NOTION_API_KEY: process.env.NOTION_API_KEY,
    NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
    ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID,
};

// Ensure that the environment variables are set
if (!module.exports.TELEGRAM_BOT_TOKEN) {
    throw new Error(
        "ERR>> TELEGRAM_BOT_TOKEN is not set in the environment variables."
    );
}
if (!module.exports.PERPLEXITY_API_KEY) {
    throw new Error(
        "ERR>> PERPLEXITY_API_KEY is not set in the environment variables."
    );
}
if (!module.exports.ALLOWED_GROUPS) {
    throw new Error(
        "ERR>> ALLOWED_GROUPS is not set in the environment variables."
    );
}
if (!module.exports.USERNAME_SPECIAL_FN) {
    throw new Error(
        "ERR>> USERNAME_SPECIAL_FN is not set in the environment variables."
    );
}
if (!module.exports.ENCRYPTION_KEY) {
    throw new Error(
        "ERR>> ENCRYPTION_KEY is not set in the environment variables."
    );
}
if (!module.exports.ADMIN_USERNAME) {
    throw new Error(
        "ERR>> ADMIN_USERNAME is not set in the environment variables."
    );
}
if (!module.exports.PORT) {
    console.warn("⚠️ PORT is not set, defaulting to 3000.");
    module.exports.port = 3000; // Default port
}
if (!module.exports.NOTION_API_KEY) {
    throw new Error(
        "ERR>> NOTION_API_KEY is not set in the environment variables."
    );
}
if (!module.exports.NOTION_DATABASE_ID) {
    throw new Error(
        "ERR>> NOTION_DATABASE_ID is not set in the environment variables."
    );
}
if (!module.exports.ADMIN_CHAT_ID) {
    throw new Error(
        "ERR>> ADMIN_CHAT_ID is not set in the environment variables."
    );
}
