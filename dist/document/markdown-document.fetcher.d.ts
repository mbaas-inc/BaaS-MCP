import { MarkdownDocument } from "./types.js";
export declare class MarkdownDocumentFetcher {
    fetch(url: string): Promise<MarkdownDocument>;
    private extractMetadata;
    private extractCodeBlocks;
    private extractHeadings;
    private extractKeywordsFromText;
    private extractKeywordsFromUrl;
    private extractCategoryFromUrl;
}
//# sourceMappingURL=markdown-document.fetcher.d.ts.map