const { escapeHtml } = require("../../../bot/utils/escapeHtml");

describe("escapeHtml", () => {
    test("escapes special characters", () => {
        const input = `& < > " '`;
        const out = escapeHtml(input);
        expect(out).toBe("&amp; &lt; &gt; &quot; &#39;");
    });

    test("returns non-string unchanged", () => {
        const val = 123;
        expect(escapeHtml(val)).toBe(val);
    });
});
