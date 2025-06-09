const { NOTION_DATABASE_ID, NOTION_API_KEY } = require("../config");
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: NOTION_API_KEY });

const checkUserBanned = async (username) => {
    if (typeof username !== "string" || !username.trim()) {
        console.error("❌ Invalid username:", username);
        return null;
    }

    try {
        const response = await notion.databases.query({
            database_id: NOTION_DATABASE_ID,
            filter: {
                property: "Username",
                rich_text: {
                    equals: username.trim(),
                },
            },
        });

        if (response.results.length === 0) {
            console.warn("⚠️ User not found in Notion:", username);
            return null;
        }

        const userPage = response.results[0];
        const isBanned = userPage.properties?.isBanned?.checkbox ?? null;

        return isBanned;
    } catch (err) {
        console.error("❌ Error checking user banned status in Notion:", err);
        return null;
    }
};

module.exports = { checkUserBanned };
