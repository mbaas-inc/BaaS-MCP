import { MarkdownDocumentFetcher } from "./markdown-document.fetcher.js";
import { BaaSDocument } from "./baas-document.js";
import { RawDocs } from "./types.js";
export declare class BaaSDocumentLoader {
    private readonly rawDocs;
    private readonly documentFetcher;
    private documentId;
    private readonly links;
    private readonly baasDocuments;
    constructor(rawDocs: RawDocs[], documentFetcher: MarkdownDocumentFetcher);
    load(): Promise<void>;
    getDocuments(): BaaSDocument[];
    getDocumentByUrl(url: string): BaaSDocument | undefined;
    getDocumentsByCategory(category: string): BaaSDocument[];
    private collectAll;
    private collect;
}
//# sourceMappingURL=baas-document.loader.d.ts.map