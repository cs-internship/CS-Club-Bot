const { escapeHtml } = require("../../../bot/utils/escapeHtml");
const {
    formatGroupMessageChunks,
} = require("../../../bot/utils/formatGroupMessage");
const { safeChunkText } = require("../../../bot/utils/safeChunkText");

describe("formatGroupMessageChunks", () => {
    test("when no chart uses safeChunkText on escaped full message", () => {
        const resp = "hello & world";
        const limit = 50;
        const explanationLink =
            "\n\nتوضیح نحوه ساخت پیام:\n\nhttps://t.me/cs_internship/729";
        const expected = safeChunkText(
            escapeHtml(resp + explanationLink),
            limit
        );
        expect(formatGroupMessageChunks(resp, limit)).toEqual(expected);
    });

    test("when chart and prefix too large (available1 <=0) returns first slice and then hidden chunks", () => {
        const first = "A".repeat(100);
        const second = "hidden content";
        const limit = 50;
        const chunks = formatGroupMessageChunks(`${first}📊${second}`, limit);

        // first chunk should be truncated slice of escaped first part
        expect(chunks[0]).toBe(escapeHtml(first).slice(0, limit));

        // there should be at least one chunk that contains the blockquote wrapper
        expect(chunks.find((c) => c.includes("<blockquote"))).toBeTruthy();
    });

    test("when chart splits hidden content across multiple chunks", () => {
        const first = "Intro";
        const second = "X".repeat(500);
        const limit = 100;
        const chunks = formatGroupMessageChunks(`${first}📊${second}`, limit);

        // first chunk contains the "برای دیدن ادامه" header and the blockquote
        expect(chunks[0]).toContain("برای دیدن ادامه");
        expect(chunks[0]).toContain("<blockquote");

        // all additional chunks (if present) should also contain a blockquote
        expect(chunks.slice(1).every((c) => c.includes("<blockquote"))).toBe(
            true
        );
    });
});
