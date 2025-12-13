require("dotenv").config();

const config = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    PORT: process.env.PORT || 3000,
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    IS_TEST_BOT:
        typeof process.env.IS_TEST_BOT === "string" &&
        process.env.IS_TEST_BOT.toLowerCase() === "true",
    USERNAME_SPECIAL_FN: process.env.USERNAME_SPECIAL_FN,
    ALLOWED_GROUPS: (process.env.ALLOWED_GROUPS || "")
        .split(",")
        .map((v) => (v === "" ? NaN : Number(v)))
        .filter(Boolean),
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    FORM_BASE_URL: "https://tally.so/r/mOy7j7",
    NOTION_API_KEY: process.env.NOTION_API_KEY,
    NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
    ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER,
};

// Validate required vars in production; in non-production warn but don't throw so tests and dev flows work
const requiredChecks = [
    {
        key: "TELEGRAM_BOT_TOKEN",
        msg: "ERR>> TELEGRAM_BOT_TOKEN is not set in the environment variables.",
    },
    {
        key: "PERPLEXITY_API_KEY",
        msg: "ERR>> PERPLEXITY_API_KEY is not set in the environment variables.",
    },
    {
        key: "USERNAME_SPECIAL_FN",
        msg: "ERR>> USERNAME_SPECIAL_FN is not set in the environment variables.",
    },
    {
        key: "ENCRYPTION_KEY",
        msg: "ERR>> ENCRYPTION_KEY is not set in the environment variables.",
    },
    {
        key: "ADMIN_USERNAME",
        msg: "ERR>> ADMIN_USERNAME is not set in the environment variables.",
    },
    {
        key: "NOTION_API_KEY",
        msg: "ERR>> NOTION_API_KEY is not set in the environment variables.",
    },
    {
        key: "NOTION_DATABASE_ID",
        msg: "ERR>> NOTION_DATABASE_ID is not set in the environment variables.",
    },
    {
        key: "ADMIN_CHAT_ID",
        msg: "ERR>> ADMIN_CHAT_ID is not set in the environment variables.",
    },
    {
        key: "CLOUDINARY_CLOUD_NAME",
        msg: "ERR>> CLOUDINARY_CLOUD_NAME is not set in the environment variables.",
    },
    {
        key: "CLOUDINARY_API_KEY",
        msg: "ERR>> CLOUDINARY_API_KEY is not set in the environment variables.",
    },
    {
        key: "CLOUDINARY_API_SECRET",
        msg: "ERR>> CLOUDINARY_API_SECRET is not set in the environment variables.",
    },
    {
        key: "CLOUDINARY_FOLDER",
        msg: "ERR>> CLOUDINARY_FOLDER is not set in the environment variables.",
    },
];

const isProduction = process.env.NODE_ENV === "production";
for (const check of requiredChecks) {
    const val = config[check.key];
    const missing =
        val === undefined ||
        val === null ||
        (typeof val === "string" && !val.trim());
    if (missing) {
        const err = new Error(check.msg);
        if (isProduction) {
            throw err;
        } else {
            console.warn(`WARN: ${check.msg}`);
        }
    }
}

if (!config.ALLOWED_GROUPS || config.ALLOWED_GROUPS.length === 0) {
    const msg = "ERR>> ALLOWED_GROUPS is not set in the environment variables.";
    if (isProduction) throw new Error(msg);
    console.warn(`WARN: ${msg}`);
}

module.exports = config;
