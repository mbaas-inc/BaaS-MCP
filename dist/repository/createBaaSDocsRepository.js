import { MarkdownDocumentFetcher } from "../document/markdown-document.fetcher.js";
import { parseLLMText } from "../document/parseLLMText.js";
import { BaaSDocumentLoader } from "../document/baas-document.loader.js";
import { BaaSDocsRepository } from "./baas-docs.repository.js";
export async function createBaaSDocsRepository(link = "https://docs.aiapp.link/llms.txt") {
    try {
        const response = await fetch(link, {
            headers: {
                "user-agent": "AIApp BaaS MCP Server",
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch LLM text: ${response.statusText}`);
        }
        const llmText = await response.text();
        const rawDocs = parseLLMText(llmText);
        if (rawDocs.length === 0) {
            return new BaaSDocsRepository([]);
        }
        const loader = new BaaSDocumentLoader(rawDocs, new MarkdownDocumentFetcher());
        await loader.load();
        const documents = loader.getDocuments();
        return new BaaSDocsRepository(documents);
    }
    catch (error) {
        // Return empty repository as fallback
        return new BaaSDocsRepository([]);
    }
}
//# sourceMappingURL=createBaaSDocsRepository.js.map