const { Client } = require("@notionhq/client");

const { NOTION_DATABASE_ID, NOTION_API_KEY } = require("../config");

const notion = new Client({ auth: NOTION_API_KEY });

const checkUserExists = async (telegramId) => {
    try {
        const response = await notion.databases.query({
            database_id: NOTION_DATABASE_ID,
            filter: {
                property: "Telegram ID",
                number: {
                    equals: telegramId,
                },
            },
        });

        const userExists = response.results.length > 0;
        // console.log("✅ User exists in Notion:", userExists);

        return userExists;
    } catch (err) {
        console.error("❌ Error checking user in Notion:", err);
        return true;
    }
};

module.exports = { checkUserExists };
