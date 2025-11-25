// Safer chunking that tries not to split HTML tags: first try to split at newline, otherwise at last '>' before limit.
// If none found, fall back to plain slice (rare).

const safeChunkText = (fullText, limit = 4000) => {
    const chunks = [];
    let remaining = fullText;

    while (remaining.length > 0) {
        if (remaining.length <= limit) {
            chunks.push(remaining);
            break;
        }

        // try split at last newline within limit
        let slice = remaining.slice(0, limit);
        let cutIndex = slice.lastIndexOf("\n");

        if (cutIndex > Math.floor(limit * 0.5)) {
            // prefer newline if reasonably far in
            chunks.push(remaining.slice(0, cutIndex));
            remaining = remaining.slice(cutIndex);
            continue;
        }

        // try split at last '>' within limit to avoid open tags
        const lastClose = slice.lastIndexOf(">");
        const lastOpen = slice.lastIndexOf("<");
        if (lastClose !== -1 && lastClose > lastOpen) {
            // safe to cut after last '>'
            chunks.push(remaining.slice(0, lastClose + 1));
            remaining = remaining.slice(lastClose + 1);
            continue;
        }

        // fallback: split at limit (not ideal, but rare)
        chunks.push(slice);
        remaining = remaining.slice(limit);
    }

    // trim chunks
    return chunks.map((c) => c.trim());
};

module.exports = { safeChunkText };
