const { formatGroupMessage } = require("../../../bot/utils/formatGroupMessage");

test("formatGroupMessage handles non-string input (number)", () => {
    const out = formatGroupMessage(12345);
    expect(out).toContain("توضیح نحوه ساخت پیام");
});
