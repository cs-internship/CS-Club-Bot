const fs = require("fs");
const path = require("path");

const { systemMessage } = require("../../../bot/constants/systemMessage");

describe("systemMessage export", () => {
    test("reads system-message.md content", () => {
        const md = fs.readFileSync(
            path.join(process.cwd(), "bot", "constants", "system-message.md"),
            "utf-8"
        );
        expect(systemMessage).toBe(md);
        expect(systemMessage.length).toBeGreaterThan(0);
    });
});
