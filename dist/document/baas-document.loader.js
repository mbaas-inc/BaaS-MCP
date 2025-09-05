import { BaaSDocument } from "./baas-document.js";
export class BaaSDocumentLoader {
    rawDocs;
    documentFetcher;
    documentId = 0;
    links = [];
    baasDocuments = new Map();
    constructor(rawDocs, documentFetcher) {
        this.rawDocs = rawDocs;
        this.documentFetcher = documentFetcher;
        this.rawDocs.forEach((doc) => {
            if (doc.link) {
                this.links.push(doc.link);
            }
        });
    }
    async load() {
        await this.collectAll();
    }
    getDocuments() {
        return Array.from(this.baasDocuments.values());
    }
    getDocumentByUrl(url) {
        return this.baasDocuments.get(url);
    }
    getDocumentsByCategory(category) {
        return this.getDocuments().filter(doc => doc.getCategory() === category);
    }
    async collectAll() {
        await Promise.all(this.rawDocs.map(async (docs) => {
            try {
                if (this.baasDocuments.has(docs.link)) {
                    return;
                }
                const baasDocument = await this.collect(docs);
                this.baasDocuments.set(docs.link, baasDocument);
            }
            catch (error) {
                console.error(`Failed to fetch document from ${docs.link}:`, error);
            }
        }));
    }
    async collect(docs) {
        const document = await this.documentFetcher.fetch(docs.link);
        const keywordSet = new Set();
        // Add metadata keywords in different cases
        document.metadata.keywords.forEach((keyword) => {
            keywordSet.add(keyword.toLowerCase());
            keywordSet.add(keyword.toUpperCase());
            keywordSet.add(keyword);
        });
        // Add title and description words
        const titleWords = document.metadata.title.toLowerCase().split(/\s+/);
        const descWords = document.metadata.description.toLowerCase().split(/\s+/);
        [...titleWords, ...descWords].forEach(word => {
            if (word.length > 2) {
                keywordSet.add(word);
            }
        });
        // Add category-specific keywords
        keywordSet.add(docs.category);
        // Add common BaaS-related terms
        const baasTerms = [
            'authentication', 'auth', 'login', 'signup', 'register',
            'user', 'token', 'jwt', 'cookie', 'session',
            'api', 'endpoint', 'request', 'response',
            'security', 'validation', 'error',
            'react', 'vue', 'nextjs', 'javascript', 'typescript'
        ];
        const contentLower = document.content.toLowerCase();
        baasTerms.forEach(term => {
            if (contentLower.includes(term)) {
                keywordSet.add(term);
            }
        });
        const baasDocument = new BaaSDocument(keywordSet, document, this.documentId++, docs.category);
        return baasDocument;
    }
}
//# sourceMappingURL=baas-document.loader.js.map