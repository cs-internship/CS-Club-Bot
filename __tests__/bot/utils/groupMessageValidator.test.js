jest.mock("../../../bot/config", () => ({
    ALLOWED_GROUPS: [1111],
    ADMIN_CHAT_ID: 9999,
}));

const {
    groupMessageValidator,
} = require("../../../bot/utils/groupMessageValidator");

describe("groupMessageValidator", () => {
    test("returns false for private chat", async () => {
        const res = await groupMessageValidator("private", 0, "text", {});
        expect(res).toBe(false);
    });

    test("returns false when allowed group but has #معرفی tag", async () => {
        const res = await groupMessageValidator(
            "group",
            1111,
            "#معرفی hello",
            {}
        );
        expect(res).toBe(false);
    });

    test("returns true when allowed group and has cs_internship tag", async () => {
        const res = await groupMessageValidator(
            "group",
            1111,
            "#cs_internship",
            {}
        );
        expect(res).toBe(true);
    });

    test("sends admin message and returns false for unauthorized group", async () => {
        const sent = [];
        const mockCtx = {
            chat: { title: "Bad Chat" },
            from: { id: 55, username: "bad" },
            telegram: {
                sendMessage: async (id, text, opts) =>
                    sent.push({ id, text, opts }),
            },
        };

        const res = await groupMessageValidator(
            "group",
            2222,
            "hello",
            mockCtx
        );
        expect(res).toBe(false);
        expect(sent.length).toBe(1);
        expect(sent[0].id).toBe(9999);
        expect(sent[0].text).toMatch(/Unauthorized chat detected/);
    });
});
