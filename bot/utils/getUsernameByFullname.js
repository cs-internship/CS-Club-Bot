const { Client } = require("@notionhq/client");
const { NOTION_API_KEY, NOTION_DATABASE_ID } = require("../config");

const notion = new Client({
    auth: NOTION_API_KEY,
});

const DATABASE_ID = NOTION_DATABASE_ID;

const getUsernameByFullname = async (fullname) => {
    try {
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
            filter: {
                property: "Full Name",
                rich_text: {
                    equals: fullname,
                },
            },
        });

        if (response.results.length === 0) {
            throw new Error(`User with fullname "${fullname}" not found.`);
        }

        const page = response.results[0];
        const usernameProp = page.properties["Username"];

        if (!usernameProp || usernameProp.type !== "rich_text") {
            throw new Error("Invalid 'Username' property format.");
        }

        return usernameProp.rich_text[0]?.plain_text || null;
    } catch (err) {
        console.error("❌ Error in getUsernameByFullname:", err.message);
        return null;
    }
};

module.exports = { getUsernameByFullname };
