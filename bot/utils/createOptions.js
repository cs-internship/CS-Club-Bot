const { systemMessage } = require("../constants/systemMessage");

/* istanbul ignore next */
const createMessage = (newMessage, imageUrls = []) => {
    const userContent = [
        { type: "text", text: newMessage },
        /* istanbul ignore next */
        ...imageUrls.map((url) => ({
            type: "image_url",
            image_url: { url },
        })),
    ];

    // console.log("User content:", userContent);

    return [
        {
            role: "system",
            content: [{ type: "text", text: systemMessage }],
        },
        {
            role: "user",
            content: userContent,
        },
    ];
};

const createOptions = (apiKeyPPLX, newMessage, imageUrls = []) => {
    return {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKeyPPLX}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "sonar-pro",
            messages: createMessage(newMessage, imageUrls),
            temperature: 0.2,
            top_p: 0.85,
            top_k: 0,
            presence_penalty: 0,
            frequency_penalty: 1,
            max_tokens: 2000,
            stream: false,
            return_citations: true,
            return_images: false,
            return_related_questions: false,
        }),
    };
};

module.exports = { createOptions };
