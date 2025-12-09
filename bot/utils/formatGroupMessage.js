const { escapeHtml } = require("./escapeHtml");
const { safeChunkText } = require("./safeChunkText");

const TELEGRAM_LIMIT = 4000;

const formatGroupMessage = (response) => {
    const explanationLink =
        "\n\nتوضیح نحوه ساخت پیام:\n\nhttps://t.me/cs_internship/729";
    const respStr = String(response ?? "");

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

const formatGroupMessageChunks = (response, limit = TELEGRAM_LIMIT) => {
    const explanationLink =
        "\n\nتوضیح نحوه ساخت پیام:\n\nhttps://t.me/cs_internship/729";
    const respStr = String(response ?? "");

    if (!respStr.includes("📊")) {
        const full = escapeHtml(respStr + explanationLink);
        return safeChunkText(full, limit);
    }

    const [firstPartRaw, secondPartRaw] = respStr.split("📊");

    const firstEsc = escapeHtml(firstPartRaw.trim());
    const hiddenPlain = secondPartRaw.trim() + explanationLink;
    const hiddenEsc = escapeHtml(hiddenPlain);

    const openTag = "<blockquote expandable>";
    const closeTag = "</blockquote>";

    const headerFirst = "\n\n📊 <b>برای دیدن ادامه کلیک کنید:</b>\n";
    const headerNext = "\n\n📊 <b>ادامه:</b>\n";

    const chunks = [];

    let prefix1 = `${firstEsc}${headerFirst}${openTag}`;
    let available1 = limit - (prefix1.length + closeTag.length);

    let offset = 0;

    if (available1 <= 0) {
        chunks.push(firstEsc.slice(0, limit));

        prefix1 = `${headerFirst}${openTag}`;
        available1 = limit - (prefix1.length + closeTag.length);
    }

    const body1 = hiddenEsc.slice(0, Math.max(0, available1));
    chunks.push(prefix1 + body1 + closeTag);
    offset += body1.length;

    while (offset < hiddenEsc.length) {
        const prefix = `${headerNext}${openTag}`;
        const available = limit - (prefix.length + closeTag.length);

        if (available <= 0) {
            chunks.push(hiddenEsc.slice(offset, offset + limit));
            offset += limit;
            continue;
        }

        const body = hiddenEsc.slice(offset, offset + available);
        chunks.push(prefix + body + closeTag);
        offset += body.length;
    }

    return chunks;
};

module.exports = { formatGroupMessage, formatGroupMessageChunks };
