import axios from "axios";
import { JSDOM } from "jsdom";

async function fetchPageContent(url) {
    try {
        const response = await axios.get(url, { timeout: 10000 });
        const dom = new JSDOM(response.data);
        const textContent = dom.window.document.body.textContent;
        return textContent.replace(/\s+/g, " ").trim();
    } catch (err) {
        console.error("❌ Error fetching page content:", url, err.message);
        return "";
    }
}

async function searchMicrosoftDocs(query) {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://learn.microsoft.com/api/search?search=${encodedQuery}&$top=2&locale=en-us`;

        const response = await axios.get(url, {
            headers: { Accept: "application/json" },
        });

        const results = response.data.results || [];
        if (results.length === 0) return [];

        const enrichedResults = [];
        for (const item of results) {
            const content = await fetchPageContent(item.url); 
            enrichedResults.push({
                title: item.title,
                url: item.url,
                snippet: item.summary || "",
                content,
            });
        }

        return enrichedResults;
    } catch (error) {
        console.error("❌ Error searching Microsoft Docs:", error.message);
        return [];
    }
}

// Test
(async () => {
    const query = "Difference between class and struct in C#";
    const items = await searchMicrosoftDocs(query);

    items.forEach((item, idx) => {
        console.log(`\nResult ${idx + 1}:`);
        console.log("Title:", item.title);
        console.log("URL:", item.url);
        console.log("Snippet:", item.snippet);
        console.log("Content preview:", item.content.slice(0, 500), "...");
    });
})();
