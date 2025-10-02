const { escapeHtml } = require("./escapeHtml");

const formatGroupMessage = (response) => {
    const explanationLink =
        "\n\nتوضیح نحوه ساخت پیام:\n\nhttps://t.me/cs_internship/729";
    const respStr =
        typeof response === "string" ? response : String(response || "");

    if (respStr.includes("📊")) {
        const [firstPart, secondPart] = respStr.split("📊");
        return `${escapeHtml(firstPart.trim())}

📊 <b>برای دیدن ادامه کلیک کنید:</b>
<blockquote expandable>${escapeHtml(secondPart.trim())}${escapeHtml(
            explanationLink
        )}</blockquote>`;
    }

    return escapeHtml(respStr) + escapeHtml(explanationLink);
};

module.exports = { formatGroupMessage };
