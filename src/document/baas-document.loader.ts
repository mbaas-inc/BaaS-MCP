import { MarkdownDocumentFetcher } from "./markdown-document.fetcher.js";
import { BaaSDocument } from "./baas-document.js";
import { RawDocs } from "./types.js";

export class BaaSDocumentLoader {
  private documentId: number = 0;
  private readonly links: string[] = [];
  private readonly baasDocuments: Map<string, BaaSDocument> = new Map();

  constructor(
    private readonly rawDocs: RawDocs[],
    private readonly documentFetcher: MarkdownDocumentFetcher
  ) {
    this.rawDocs.forEach((doc) => {
      if (doc.link) {
        this.links.push(doc.link);
      }
    });
  }

  async load(): Promise<void> {
    await this.collectAll();
  }

  getDocuments(): BaaSDocument[] {
    return Array.from(this.baasDocuments.values());
  }

  getDocumentByUrl(url: string): BaaSDocument | undefined {
    return this.baasDocuments.get(url);
  }

  getDocumentsByCategory(category: string): BaaSDocument[] {
    return this.getDocuments().filter(doc => doc.getCategory() === category);
  }

  private async collectAll() {
    await Promise.all(
      this.rawDocs.map(async (docs) => {
        try {
          if (this.baasDocuments.has(docs.link)) {
            return;
          }

          const baasDocument = await this.collect(docs);
          this.baasDocuments.set(docs.link, baasDocument);
        } catch (error) {
          console.error(`Failed to fetch document from ${docs.link}:`, error);
        }
      })
    );
  }

  private async collect(docs: RawDocs): Promise<BaaSDocument> {
    const document = await this.documentFetcher.fetch(docs.link);

    const keywordSet = new Set<string>();

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

    const baasDocument = new BaaSDocument(
      keywordSet,
      document,
      this.documentId++,
      docs.category
    );

    return baasDocument;
  }
}