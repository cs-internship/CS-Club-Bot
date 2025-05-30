const fetch = require("node-fetch");
const createOptions = require("../utils/createOptions");
const { ERROR_RESPONSES } = require("../constants/errorResponses");
const { PERPLEXITY_API_KEY } = require("../config");

async function sendToPerplexity(input) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    try {
        const options = {
            ...createOptions.createOptions(PERPLEXITY_API_KEY, input),
            signal: controller.signal,
        };

        const res = await fetch(
            "https://api.perplexity.ai/chat/completions",
            options
        );

        if (!res.ok) {
            const status = res.status;
            const body = await res.text();
            console.error("❌ Perplexity API Error", status, body);
            return (
                Object.values(ERROR_RESPONSES).find((e) => e.code === status)
                    ?.code || ERROR_RESPONSES.UNKNOWN.code
            );
        }

        const resJson = await res.json();
        return resJson.choices[0].message.content.replace(/\[\d+\]/g, "");
    } catch (error) {
        if (error.name === "AbortError") {
            return ERROR_RESPONSES.TIMEOUT.code;
        }
        console.error("❌ Exception in sendToPerplexity:", error);
        return ERROR_RESPONSES.EXCEPTION.code;
    } finally {
        clearTimeout(timeout);
    }
}

module.exports = { sendToPerplexity };
