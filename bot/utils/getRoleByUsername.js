const { Client } = require("@notionhq/client");
const { NOTION_API_KEY, NOTION_DATABASE_ID } = require("../config");

const notion = new Client({ auth: NOTION_API_KEY });
const DATABASE_ID = NOTION_DATABASE_ID;

const allowedRoles = ["Web", "Machine Learning", "C#"];

const getRoleByUsername = async (username) => {
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
        const roleProp = page.properties["Role"];

        if (!roleProp || roleProp.type !== "multi_select") {
            throw new Error("Invalid 'Role' property format.");
        }

        const role = roleProp.multi_select[0]?.name || null;

        if (allowedRoles.includes(role)) {
            return role;
        } else {
            console.warn(`⚠️ Role "${role}" is not in allowedRoles.`);
            return null;
        }
    } catch (err) {
        console.error("❌ Error in getRoleByUsername:", err.message);
        return null;
    }
};

module.exports = { getRoleByUsername };
