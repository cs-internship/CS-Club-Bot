const { formatGroupMessage } = require("../../../bot/utils/formatGroupMessage");

describe("formatGroupMessage", () => {
    test("adds explanation link and escapes when no chart", () => {
        const out = formatGroupMessage("hello & world");
        expect(out).toContain("توضیح نحوه ساخت پیام");
        // ensure escaped ampersand
        expect(out).toContain("&amp;");
    });

    test("formats when contains chart marker", () => {
        const input = "Intro 📊 Details & more";
        const out = formatGroupMessage(input);
        expect(out).toContain("📊");
        expect(out).toContain("<blockquote");
        expect(out).toContain("&amp;");
    });
});
