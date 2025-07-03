const { Client } = require("@notionhq/client");
const { NOTION_API_KEY, NOTION_DATABASE_ID } = require("../config");

const notion = new Client({ auth: NOTION_API_KEY });
const DATABASE_ID = NOTION_DATABASE_ID;

const allowedRules = ["Web", "Machine Learning", "C#"];

const getRuleByUsername = async (username) => {
    try {
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
            filter: {
                property: "Username",
                rich_text: {
                    equals: username,
                },
            },
        });

        if (response.results.length === 0) {
            throw new Error(`User with username "${username}" not found.`);
        }

        const page = response.results[0];
        const ruleProp = page.properties["Rule"];

        if (!ruleProp || ruleProp.type !== "multi_select") {
            throw new Error("Invalid 'Rule' property format.");
        }

        const rule = ruleProp.multi_select[0]?.name || null;

        if (allowedRules.includes(rule)) {
            return rule;
        } else {
            console.warn(`⚠️ Rule "${rule}" is not in allowedRules.`);
            return null;
        }
    } catch (err) {
        console.error("❌ Error in getRuleByUsername:", err.message);
        return null;
    }
};

module.exports = { getRuleByUsername };
