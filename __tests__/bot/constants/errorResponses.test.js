const { ERROR_RESPONSES } = require("../../../bot/constants/errorResponses");

describe("ERROR_RESPONSES constant", () => {
    test("has expected keys and messages", () => {
        expect(ERROR_RESPONSES).toHaveProperty("FORBIDDEN");
        expect(ERROR_RESPONSES.FORBIDDEN).toHaveProperty("code");
        expect(typeof ERROR_RESPONSES.FORBIDDEN.message).toBe("string");

        // ensure UNKNOWN uses code 'UNKNOWN_ERROR'
        expect(ERROR_RESPONSES.UNKNOWN.code).toBe("UNKNOWN_ERROR");
    });
});
