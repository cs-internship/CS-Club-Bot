const {
    formatGroupMessageChunks,
} = require("../../../bot/utils/formatGroupMessage");

const explanationLink =
    "\n\nتوضیح نحوه ساخت پیام:\n\nhttps://t.me/cs_internship/729";

describe("formatGroupMessageChunks", () => {
    test("when no chart splits by lines and escapes", () => {
        const resp = "hello & world";
        const limit = 50;

        const expected = [
            `hello &amp; world\n\nتوضیح نحوه ساخت پیام:\n\n`,
            "https://t.me/cs_internship/729",
        ];

        expect(formatGroupMessageChunks(resp, limit)).toEqual(expected);
    });

    test("when chart prefix is larger than limit it chunks the intro separately", () => {
        const first = "A".repeat(100);
        const second = "hidden content";
        const limit = 50;

        const expected = [
            "A".repeat(50),
            "A".repeat(50),
            `\n\n📊 <b>برای دیدن ادامه کلیک کنید:</b>\n<blockquote expandable></blockquote>`,
        ];

        expect(formatGroupMessageChunks(`${first}📊${second}`, limit)).toEqual(
            expected
        );
    });

    test("splits long hidden content across multiple blockquote chunks", () => {
        const resp = `Intro📊one\ntwo\nthree\nfour\nfive`;
        const limit = 120;

        const chunks = formatGroupMessageChunks(resp, limit);

        expect(chunks).toEqual([
            `Intro\n\n📊 <b>برای دیدن ادامه کلیک کنید:</b>\n<blockquote expandable>one\ntwo\nthree\nfour\nfive\n\n</blockquote>`,
            `\n\n📊 <b>ادامه:</b>\n<blockquote expandable>توضیح نحوه ساخت پیام:\n\n</blockquote>`,
            `\n\n📊 <b>ادامه:</b>\n<blockquote expandable>https://t.me/cs_internship/729</blockquote>`,
        ]);

        expect(chunks.every((c) => c.includes("<blockquote"))).toBe(true);
    });
});
