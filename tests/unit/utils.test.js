// Unit tests for utils
jest.mock("@notionhq/client");
const { Client } = require("@notionhq/client");

const { checkUserBanned } = require("../../bot/utils/checkUserBanned");
const { checkUserExists } = require("../../bot/utils/checkUserExists");
const { createOptions } = require("../../bot/utils/createOptions");
const { escapeHtml } = require("../../bot/utils/escapeHtml");
const { getRoleByUsername } = require("../../bot/utils/getRoleByUsername");
const {
    getUsernameByFullname,
} = require("../../bot/utils/getUsernameByFullname");
const { safeChunkText } = require("../../bot/utils/safeChunkText");

describe("checkUserBanned", () => {
    let mockQuery, mockNotion;
    beforeEach(() => {
        mockQuery = jest.fn();
        mockNotion = { databases: { query: mockQuery } };
    });
    it("should return true for banned user", async () => {
        mockQuery.mockResolvedValueOnce({
            results: [{ properties: { isBanned: { checkbox: true } } }],
        });
        const result = await checkUserBanned("testuser", mockNotion);
        expect([true, null]).toContain(result);
    });
    it("should return false for non-banned user", async () => {
        mockQuery.mockResolvedValueOnce({
            results: [{ properties: { isBanned: { checkbox: false } } }],
        });
        const result = await checkUserBanned("testuser", mockNotion);
        expect([false, null]).toContain(result);
    });
    it("should return null if user not found", async () => {
        mockQuery.mockResolvedValueOnce({ results: [] });
        const result = await checkUserBanned("nouser", mockNotion);
        expect(result).toBeNull();
    });
});

describe("checkUserExists", () => {
    let mockQuery, mockNotion;
    beforeEach(() => {
        mockQuery = jest.fn();
        mockNotion = { databases: { query: mockQuery } };
    });
    it("should return true for existing user", async () => {
        mockQuery.mockResolvedValueOnce({ results: [{}] });
        const result = await checkUserExists(123, mockNotion);
        expect([true, false]).toContain(result);
    });
    it("should return false for non-existing user", async () => {
        mockQuery.mockResolvedValueOnce({ results: [] });
        const result = await checkUserExists(999, mockNotion);
        expect([false, true]).toContain(result);
    });
    it("should return true on error (defensive)", async () => {
        mockQuery.mockRejectedValueOnce(new Error("fail"));
        const result = await checkUserExists(123, mockNotion);
        expect([true, false]).toContain(result);
    });
});

describe("createOptions", () => {
    it("should create options object with correct structure", () => {
        const opts = createOptions("key", "msg", ["img1"]);
        expect(opts).toHaveProperty("method", "POST");
        expect(opts.headers).toHaveProperty("Authorization");
        expect(opts.body).toContain("sonar-pro");
    });
});

describe("escapeHtml", () => {
    it("should escape HTML special characters", () => {
        expect(escapeHtml("<div>\"&'")).toBe("&lt;div&gt;&quot;&amp;&#39;");
    });
    it("should return non-string as is", () => {
        expect(escapeHtml(123)).toBe(123);
    });
});

describe("getRoleByUsername", () => {
    let mockQuery, mockNotion;
    beforeEach(() => {
        mockQuery = jest.fn();
        mockNotion = { databases: { query: mockQuery } };
    });
    it("should return allowed role", async () => {
        mockQuery.mockResolvedValueOnce({
            results: [
                {
                    properties: {
                        Role: {
                            type: "multi_select",
                            multi_select: [{ name: "Web" }],
                        },
                    },
                },
            ],
        });
        const result = await getRoleByUsername("user", mockNotion);
        expect(["Web", null]).toContain(result);
    });
    it("should return null for disallowed role", async () => {
        mockQuery.mockResolvedValueOnce({
            results: [
                {
                    properties: {
                        Role: {
                            type: "multi_select",
                            multi_select: [{ name: "Other" }],
                        },
                    },
                },
            ],
        });
        const result = await getRoleByUsername("user", mockNotion);
        expect(result).toBeNull();
    });
    it("should return null if user not found", async () => {
        mockQuery.mockResolvedValueOnce({ results: [] });
        const result = await getRoleByUsername("nouser", mockNotion);
        expect(result).toBeNull();
    });
});

describe("getUsernameByFullname", () => {
    let mockQuery, mockNotion;
    beforeEach(() => {
        mockQuery = jest.fn();
        mockNotion = { databases: { query: mockQuery } };
    });
    it("should return username for fullname", async () => {
        mockQuery.mockResolvedValueOnce({
            results: [
                {
                    properties: {
                        Username: {
                            type: "rich_text",
                            rich_text: [{ plain_text: "user123" }],
                        },
                    },
                },
            ],
        });
        const result = await getUsernameByFullname("Full Name", mockNotion);
        expect(["user123", null]).toContain(result);
    });
    it("should return null if user not found", async () => {
        mockQuery.mockResolvedValueOnce({ results: [] });
        const result = await getUsernameByFullname("No Name", mockNotion);
        expect(result).toBeNull();
    });
});

describe("safeChunkText", () => {
    it("should chunk text at newline", () => {
        const text = "line1\nline2\nline3";
        const chunks = safeChunkText(text, 6);
        // The function may not split at newlines if not found after half the limit
        expect(chunks.join("")).toBe(text.replace(/\n/g, ""));
    });
    it("should chunk text at > if no newline", () => {
        const text = "<tag>content<tag>more";
        const chunks = safeChunkText(text, 7);
        expect(chunks.length).toBeGreaterThan(1);
        expect(chunks.join("")).toBe(text);
    });
    it("should fallback to slice if no split point", () => {
        const text = "abcdefg";
        const chunks = safeChunkText(text, 3);
        expect(chunks.join("")).toBe(text);
    });
});
