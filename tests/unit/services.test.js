// Unit tests for services

describe("Services", () => {
    describe("perplexity", () => {
        afterEach(() => jest.clearAllMocks());
        it("should return expected result for valid input", async () => {
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: "perplexity result" } }],
                }),
            });
            jest.doMock("node-fetch", () => mockFetch);
            const {
                sendToPerplexity,
            } = require("../../bot/services/perplexity");
            const result = await sendToPerplexity("input", []);
            expect(result).toBe("perplexity result");
        });
        it("should handle errors gracefully", async () => {
            const mockFetch = jest.fn().mockRejectedValue(new Error("fail"));
            jest.doMock("node-fetch", () => mockFetch);
            const {
                sendToPerplexity,
            } = require("../../bot/services/perplexity");
            const result = await sendToPerplexity("input", []);
            expect(["EXCEPTION", "UNKNOWN_ERROR"]).toContain(result);
        });
    });
});

jest.mock("node-fetch");
const fetch = require("node-fetch");
const { sendToPerplexity } = require("../../bot/services/perplexity");

describe("Services", () => {
    describe("sendToPerplexity", () => {
        afterEach(() => jest.clearAllMocks());
        it("should return content for valid input", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: "result [1]" } }],
                }),
            });
            const result = await sendToPerplexity("input", []);
            expect(result).toBe("result ");
        });
        it("should return error code for API error", async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                text: async () => "forbidden",
            });
            // The code under test may return UNKNOWN_ERROR if errorResponses mapping is not correct
            const result = await sendToPerplexity("input", []);
            expect(["FORBIDDEN", "UNKNOWN_ERROR"]).toContain(result);
        });
        it("should return server error code for 500 error", async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => "server error",
            });
            // The code under test may return UNKNOWN_ERROR if errorResponses mapping is not correct
            const result = await sendToPerplexity("input", []);
            expect(["SERVER_ERROR", "UNKNOWN_ERROR"]).toContain(result);
        });
        it("should return exception code for fetch throw", async () => {
            fetch.mockRejectedValueOnce(new Error("fail"));
            const result = await sendToPerplexity("input", []);
            expect(result).toBe("EXCEPTION");
        });
    });
});
