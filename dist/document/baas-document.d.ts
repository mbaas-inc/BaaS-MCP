import { MarkdownDocument, Category } from "./types.js";
export declare class BaaSDocument {
    private readonly keywordSet;
    private readonly document;
    private readonly documentId;
    private readonly category;
    constructor(keywordSet: Set<string>, document: MarkdownDocument, documentId: number, category: Category);
    getId(): number;
    getCategory(): Category;
    getTitle(): string;
    getDescription(): string;
    getUrl(): string;
    getContent(): string;
    getKeywords(): Set<string>;
    getMetadataKeywords(): string[];
    hasKeyword(keyword: string): boolean;
    calculateRelevance(queryTerms: string[], documentFreq: Map<string, number>, totalDocs: number): number;
    private getTermFrequency;
    getRelevantChunks(queryTerms: string[], maxChunks?: number): string[];
    private scoreChunk;
    toJSON(): {
        id: number;
        title: string;
        description: string;
        url: string;
        category: Category;
        keywords: string[];
    };
}
//# sourceMappingURL=baas-document.d.ts.map