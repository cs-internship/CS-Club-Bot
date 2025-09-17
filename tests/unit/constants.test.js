// Unit tests for constants
const errorResponses = require("../../bot/constants/errorResponses");
const systemMessage = require("../../bot/constants/systemMessage");

describe("Constants", () => {
    it("should have error responses defined", () => {
        expect(errorResponses).toHaveProperty("ERROR_RESPONSES");
        expect(errorResponses.ERROR_RESPONSES).toHaveProperty("FORBIDDEN");
        expect(errorResponses.ERROR_RESPONSES).toHaveProperty("RATE_LIMIT");
        expect(errorResponses.ERROR_RESPONSES).toHaveProperty("SERVER_ERROR");
        expect(errorResponses.ERROR_RESPONSES).toHaveProperty("TIMEOUT");
        expect(errorResponses.ERROR_RESPONSES).toHaveProperty("UNKNOWN");
        expect(errorResponses.ERROR_RESPONSES).toHaveProperty("EXCEPTION");
    });
    it("should have system message defined", () => {
        expect(systemMessage).toHaveProperty("systemMessage");
        expect(typeof systemMessage.systemMessage).toBe("string");
        expect(systemMessage.systemMessage.length).toBeGreaterThan(0);
    });
});
