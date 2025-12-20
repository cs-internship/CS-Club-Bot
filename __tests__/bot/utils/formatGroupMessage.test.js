const { formatGroupMessage } = require("../../../bot/utils/formatGroupMessage");

const explanationLink =
    "\n\nتوضیح نحوه ساخت پیام:\n\nhttps://t.me/cs_internship/729";

describe("formatGroupMessage", () => {
    test("adds explanation link and escapes when no chart", () => {
        const out = formatGroupMessage("hello & world");
        expect(out).toBe(`hello &amp; world${explanationLink}`);
    });

    test("formats when contains chart marker", () => {
        const input = "Intro 📊 Details & more";
        const expected = `Intro

📊 <b>برای دیدن ادامه کلیک کنید:</b>
<blockquote expandable>Details &amp; more${explanationLink}</blockquote>`;

        expect(formatGroupMessage(input)).toBe(expected);
    });
});
