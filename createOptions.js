const { systemMessage } = require("./systemMessage");

const createMessage = (newMessage) => {
    const message = [
        {
            role: "system",
            content: systemMessage,
        },
        {
            role: "user",
            content: newMessage,
        },
    ];

    return message;
};

const createOptions = (apiKeyPPLX, newMessage) => {
    return {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKeyPPLX}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "sonar-pro",
            messages: createMessage(newMessage),
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
