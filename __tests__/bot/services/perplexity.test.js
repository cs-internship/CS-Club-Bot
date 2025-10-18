jest.resetModules();
jest.doMock("../../../bot/utils/createOptions", () => ({
    createOptions: jest.fn().mockReturnValue({ method: "POST", headers: {} }),
}));
jest.doMock("../../../bot/constants/errorResponses", () => ({
    ERROR_RESPONSES: {
        TIMEOUT: { code: 408 },
        EXCEPTION: { code: 500 },
        UNKNOWN: { code: 520 },
    },
}));
jest.doMock("../../../bot/config", () => ({ PERPLEXITY_API_KEY: "KEY" }));

const fetch = require("node-fetch");
jest.mock("node-fetch");

const { sendToPerplexity } = require("../../../bot/services/perplexity");

describe("sendToPerplexity", () => {
    afterEach(() => jest.clearAllMocks());

    test("returns content on OK response", async () => {
        const res = {
            ok: true,
            json: async () => ({
                choices: [{ message: { content: "answer [1]" } }],
            }),
        };
        fetch.mockResolvedValue(res);
        const out = await sendToPerplexity("q", []);
        expect(out).toBe("answer ");
    });

    test("returns error code on non-ok response", async () => {
        const res = { ok: false, status: 429, text: async () => "rate limit" };
        fetch.mockResolvedValue(res);
        const out = await sendToPerplexity("q", []);
        expect(out).toBe(520);
    });

    test("returns TIMEOUT on AbortError", async () => {
        const err = new Error("aborted");
        err.name = "AbortError";
        fetch.mockRejectedValue(err);
        const out = await sendToPerplexity("q", []);
        expect(out).toBe(408);
    });

    test("returns EXCEPTION on other errors", async () => {
        fetch.mockRejectedValue(new Error("boom"));
        const out = await sendToPerplexity("q", []);
        expect(out).toBe(500);
    });

    test("returns EXCEPTION when response JSON is malformed", async () => {
        const res = {
            ok: true,
            json: async () => ({}),
        };
        fetch.mockResolvedValue(res);
        const out = await sendToPerplexity("q", []);
        expect(out).toBe(500);
    });
});
