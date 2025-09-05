import { categories } from "./types.js";
export function parseLLMText(text) {
    return text
        .split("\n")
        .filter((line) => line.includes("https://docs.aiapp.link"))
        .map((line) => parse({ text: line, link: extractLink(line) }));
}
function extractLink(line) {
    const start = line.indexOf("](");
    const end = line.indexOf(")", start);
    return line.substring(start + 2, end);
}
function parse(link) {
    const { text, link: url } = link;
    const title = extractTitle(text);
    const description = extractDescription(text);
    return {
        text,
        title,
        link: url,
        description,
        category: extractCategory(url),
    };
}
function extractTitle(text) {
    const start = text.indexOf("[") + 1;
    const end = text.indexOf("](", start);
    return text.substring(start, end).trim();
}
function extractDescription(text) {
    const colonIndex = text.indexOf("):");
    if (colonIndex === -1) {
        return "";
    }
    const start = colonIndex + 2;
    return text.substring(start).trim();
}
function extractCategory(link) {
    try {
        const url = new URL(link);
        for (const category of categories) {
            if (url.pathname.includes(`/${category}/`)) {
                return category;
            }
        }
        return "unknown";
    }
    catch (error) {
        console.error(`Failed to parse URL: ${link}`, error);
        return "unknown";
    }
}
//# sourceMappingURL=parseLLMText.js.map