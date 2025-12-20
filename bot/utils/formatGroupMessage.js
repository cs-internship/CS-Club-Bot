const { escapeHtml } = require("./escapeHtml");

const TELEGRAM_LIMIT = 4000;

/**
 * Smart chunking that prefers splitting at line boundaries.
 * If a line doesn't fit into an empty chunk:
 *   - "skip": drop the line
 *   - "word": split by words (no mid-word split unless a word itself is too long -> hard split)
 *   - "hard": hard split by characters
 */
function smartChunkByLines(text, limit, opts = {}) {
    const {
        overlongLine = "skip", // "skip" | "word" | "hard"
        trimLines = false,
    } = opts;

    const normalized = String(text ?? "").replace(/\r\n/g, "\n");
    const lines = normalized.split("\n");

    const chunks = [];
    let buf = "";

    const pushBuf = () => {
        if (buf.length > 0) chunks.push(buf);
        buf = "";
    };

    const tryAdd = (piece) => {
        if (buf.length === 0) {
            if (piece.length <= limit) {
                buf = piece;
                return true;
            }
            return false;
        }
        if (buf.length + piece.length <= limit) {
            buf += piece;
            return true;
        }
        return false;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = trimLines ? lines[i].trim() : lines[i];
        const piece = i === lines.length - 1 ? line : line + "\n";

        if (tryAdd(piece)) continue;

        pushBuf();

        if (tryAdd(piece)) continue;

        // still doesn't fit => line itself too long
        if (overlongLine === "skip") {
            continue;
        }

        if (overlongLine === "word") {
            const tokens = line.split(/(\s+)/);
            let temp = "";

            const flushTemp = () => {
                if (temp.length) chunks.push(temp);
                temp = "";
            };

            for (const t of tokens) {
                if (t.length > limit) {
                    // token too long => hard split
                    flushTemp();
                    for (let off = 0; off < t.length; off += limit) {
                        chunks.push(t.slice(off, off + limit));
                    }
                    continue;
                }

                if (temp.length + t.length <= limit) {
                    temp += t;
                } else {
                    flushTemp();
                    temp = t;
                }
            }

            flushTemp();
            continue;
        }

        // overlongLine === "hard"
        for (let off = 0; off < piece.length; off += limit) {
            chunks.push(piece.slice(off, off + limit));
        }
    }

    pushBuf();

    // console.log("smartChunkByLines produced", chunks.length, "chunks");
    // console.log("chunks[0] >>", "...\n", chunks[0]?.length);
    // console.log("chunks[1] >>", "...\n", chunks[1]?.length);

    // console.log(overlongLine);

    return chunks;
}

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
        return smartChunkByLines(full, limit, {
            overlongLine: "skip",
            trimLines: false,
        });
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

    if (available1 <= 0) {
        const firstChunks = smartChunkByLines(firstEsc, limit, {
            overlongLine: "word",
        });
        chunks.push(...firstChunks);

        prefix1 = `${headerFirst}${openTag}`;
        available1 = limit - (prefix1.length + closeTag.length);
    }

    const hiddenChunksForFirst = smartChunkByLines(hiddenEsc, available1, {
        overlongLine: "skip",
    });

    if (hiddenChunksForFirst.length > 0) {
        chunks.push(prefix1 + hiddenChunksForFirst[0] + closeTag);
    } else {
        chunks.push(prefix1 + closeTag);
    }

    for (let i = 1; i < hiddenChunksForFirst.length; i++) {
        const prefix = `${headerNext}${openTag}`;
        const available = limit - (prefix.length + closeTag.length);

        const reChunks = smartChunkByLines(hiddenChunksForFirst[i], available, {
            overlongLine: "skip",
        });

        for (const part of reChunks) {
            chunks.push(prefix + part + closeTag);
        }
    }

    return chunks;
};

module.exports = {
    formatGroupMessage,
    formatGroupMessageChunks,
};
