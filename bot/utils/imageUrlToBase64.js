const fetch = require("node-fetch");

async function imageUrlToBase64(url) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch image: ${url}`);
    }

    const buffer = await res.buffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";

    return `data:${contentType};base64,${buffer.toString("base64")}`;
}

module.exports = { imageUrlToBase64 };
