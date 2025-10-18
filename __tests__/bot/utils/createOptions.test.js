// Mock system message to avoid reading file
jest.mock("../../../bot/constants/systemMessage", () => ({
    systemMessage: "SYSMSG",
}));

const { createOptions } = require("../../../bot/utils/createOptions");

describe("createOptions", () => {
    test("creates options with given api key and message", () => {
        const opts = createOptions("APIKEY", "hello", ["https://img"]);
        expect(opts.method).toBe("POST");
        expect(opts.headers.Authorization).toBe("Bearer APIKEY");
        const body = JSON.parse(opts.body);
        expect(body.messages.length).toBe(2);
        expect(body.messages[0].role).toBe("system");
        expect(
            body.messages[1].content.find((c) => c.type === "image_url")
        ).toBeTruthy();
    });
});
