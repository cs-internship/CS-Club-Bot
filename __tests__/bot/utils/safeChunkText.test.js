const { safeChunkText } = require("../../../bot/utils/safeChunkText");

describe("safeChunkText", () => {
    test("splits on newline when available", () => {
        const text = "a\n".repeat(10);
        const chunks = safeChunkText(text, 5);
        expect(chunks.length).toBeGreaterThan(1);
        chunks.forEach((c) => expect(c).not.toMatch(/\n$/));
    });

    test("splits at > to avoid open tags", () => {
        const text = "<p>one</p><p>two</p><p>three</p>";
        const chunks = safeChunkText(text, 10);
        // ensure concatenation of chunks equals original trimmed (no tags lost)
        expect(chunks.join("")).toBe(text);
    });

    test("fallback slice when nothing else found", () => {
        const text = "x".repeat(50);
        const chunks = safeChunkText(text, 10);
        expect(chunks.every((c) => c.length <= 10)).toBe(true);
    });
});
