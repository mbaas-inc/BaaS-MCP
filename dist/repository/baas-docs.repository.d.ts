import { BaaSDocument } from "../document/baas-document.js";
import { Category } from "../document/types.js";
export interface SearchResult {
    document: BaaSDocument;
    score: number;
    relevantChunks: string[];
}
export declare class BaaSDocsRepository {
    private readonly documents;
    private documentFreq;
    constructor(documents: BaaSDocument[]);
    private buildDocumentFrequency;
    searchDocuments(query: string, limit?: number, category?: Category): SearchResult[];
    getDocumentById(id: number): BaaSDocument | undefined;
    getDocumentsByCategory(category: Category): BaaSDocument[];
    getAllCategories(): Category[];
    getTotalDocuments(): number;
    private preprocessQuery;
    advancedSearch(options: {
        query: string;
        category?: Category;
        keywords?: string[];
        limit?: number;
        minScore?: number;
    }): SearchResult[];
    getSimilarDocuments(document: BaaSDocument, limit?: number): BaaSDocument[];
}
//# sourceMappingURL=baas-docs.repository.d.ts.map