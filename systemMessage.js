const fs = require("fs");
const path = require("path");

const systemMessage = fs.readFileSync(
    path.join(__dirname, "system-message.md"),
    "utf-8"
);

module.exports = { systemMessage };
