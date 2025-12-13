const fetch = require("node-fetch");

const { PERPLEXITY_API_KEY } = require("../config");
const { ERROR_RESPONSES } = require("../constants/errorResponses");
const createOptions = require("../utils/createOptions");

async function sendToPerplexity(input, photoUrls) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    try {
        console.log("photoUrls>>", photoUrls);

        const options = {
            ...createOptions.createOptions(
                PERPLEXITY_API_KEY,
                input,
                photoUrls
            ),
            signal: controller.signal,
        };

        const res = await fetch(
            "https://api.perplexity.ai/chat/completions",
            options
        );

        // console.log(options);

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
        const content = resJson.choices[0].message.content.replace(
            /\[\d+\]/g,
            ""
        );

        return content;
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
