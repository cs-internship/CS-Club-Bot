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

            // web_search_options: { search_context_size: "medium" },

            // response_format: {
            //     type: "json_schema",
            //     schema: {
            //         type: "object",
            //         properties: {
            //             summary: { type: "string" },
            //             strengths: { type: "array", items: { type: "string" } },
            //             suggestions: {
            //                 type: "array",
            //                 items: { type: "string" },
            //             },
            //             score: { type: "number" },
            //             categories: {
            //                 type: "array",
            //                 items: { type: "string" },
            //             },
            //         },
            //         required: [
            //             "summary",
            //             "strengths",
            //             "suggestions",
            //             "score",
            //             "categories",
            //         ],
            //     },
            // },
        }),
    };
};

module.exports = { createOptions };
