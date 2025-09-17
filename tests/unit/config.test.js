// Unit tests for config
const config = require("../../bot/config/index");

describe("Config", () => {
    it("should have required config properties", () => {
        expect(config).toHaveProperty("TELEGRAM_BOT_TOKEN");
        expect(config).toHaveProperty("PORT");
        expect(config).toHaveProperty("PERPLEXITY_API_KEY");
        expect(config).toHaveProperty("ENCRYPTION_KEY");
        expect(config).toHaveProperty("USERNAME_SPECIAL_FN");
        expect(config).toHaveProperty("ALLOWED_GROUPS");
        expect(config).toHaveProperty("ADMIN_USERNAME");
        expect(config).toHaveProperty("FORM_BASE_URL");
        expect(config).toHaveProperty("NOTION_API_KEY");
        expect(config).toHaveProperty("NOTION_DATABASE_ID");
        expect(config).toHaveProperty("ADMIN_CHAT_ID");
    });
});
