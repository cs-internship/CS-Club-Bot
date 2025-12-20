const { formatGroupMessage } = require("../../../bot/utils/formatGroupMessage");

test("formatGroupMessage handles non-string input (number)", () => {
    const out = formatGroupMessage(12345);
    expect(out).toBe(
        "12345\n\nتوضیح نحوه ساخت پیام:\n\nhttps://t.me/cs_internship/729"
    );
});
