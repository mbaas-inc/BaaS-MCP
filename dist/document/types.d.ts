export interface RawDocs {
    text: string;
    title: string;
    link: string;
    description: string;
    category: Category;
}
export interface DocumentMetadata {
    title: string;
    description: string;
    keywords: string[];
    category: Category;
}
export interface MarkdownDocument {
    content: string;
    metadata: DocumentMetadata;
    url: string;
}
export type Category = "api" | "templates" | "security" | "examples" | "dev" | "frameworks" | "errors" | "config" | "unknown";
export declare const categories: Category[];
//# sourceMappingURL=types.d.ts.map