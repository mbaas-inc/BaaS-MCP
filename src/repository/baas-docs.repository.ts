import { BaaSDocument } from "../document/baas-document.js";
import { Category } from "../document/types.js";

export interface SearchResult {
  document: BaaSDocument;
  score: number;
  relevantChunks: string[];
}

export class BaaSDocsRepository {
  private documentFreq: Map<string, number> = new Map();
  
  constructor(private readonly documents: BaaSDocument[]) {
    this.buildDocumentFrequency();
  }

  // Build document frequency map for BM25 scoring
  private buildDocumentFrequency() {
    for (const doc of this.documents) {
      const uniqueTerms = new Set<string>();
      
      // Collect unique terms from keywords
      doc.getKeywords().forEach(keyword => {
        uniqueTerms.add(keyword.toLowerCase());
      });
      
      // Collect unique terms from content
      const words = doc.getContent()
        .toLowerCase()
        .replace(/[^\w\s가-힣]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);
      
      words.forEach(word => uniqueTerms.add(word));
      
      // Update document frequency
      uniqueTerms.forEach(term => {
        this.documentFreq.set(term, (this.documentFreq.get(term) || 0) + 1);
      });
    }
  }

  searchDocuments(
    query: string,
    limit: number = 5,
    category?: Category
  ): SearchResult[] {
    const queryTerms = this.preprocessQuery(query);
    
    let documentsToSearch = this.documents;
    if (category) {
      documentsToSearch = documentsToSearch.filter(doc => 
        doc.getCategory() === category
      );
    }

    const results: SearchResult[] = [];

    for (const document of documentsToSearch) {
      const score = document.calculateRelevance(
        queryTerms,
        this.documentFreq,
        this.documents.length
      );

      if (score > 0) {
        const relevantChunks = document.getRelevantChunks(queryTerms, 3);
        
        results.push({
          document,
          score,
          relevantChunks
        });
      }
    }

    // Sort by score and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  getDocumentById(id: number): BaaSDocument | undefined {
    return this.documents.find(doc => doc.getId() === id);
  }

  getDocumentsByCategory(category: Category): BaaSDocument[] {
    return this.documents.filter(doc => doc.getCategory() === category);
  }

  getAllCategories(): Category[] {
    const categories = new Set<Category>();
    this.documents.forEach(doc => categories.add(doc.getCategory()));
    return Array.from(categories);
  }

  getTotalDocuments(): number {
    return this.documents.length;
  }

  private preprocessQuery(query: string): string[] {
    // Normalize and tokenize query
    const normalized = query
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .trim();

    const terms = normalized
      .split(/\s+/)
      .filter(term => term.length > 1);

    // Add synonym expansion
    const expandedTerms = new Set(terms);
    
    // Add synonyms for common terms
    const synonyms: Record<string, string[]> = {
      'login': ['signin', 'auth', 'authentication'],
      'signup': ['register', 'registration', 'create account'],
      'api': ['endpoint', 'service', 'interface'],
      'error': ['exception', 'failure', 'issue'],
      'token': ['jwt', 'credential', 'access token'],
      'cookie': ['session', 'browser storage'],
      'react': ['reactjs', 'jsx', 'tsx'],
      'vue': ['vuejs', 'vue.js'],
      'next': ['nextjs', 'next.js'],
      'javascript': ['js', 'es6', 'typescript', 'ts'],
      'security': ['auth', 'authorization', 'secure']
    };

    terms.forEach(term => {
      if (synonyms[term]) {
        synonyms[term].forEach(synonym => expandedTerms.add(synonym));
      }
    });

    return Array.from(expandedTerms);
  }

  // Advanced search with multiple filters
  advancedSearch(options: {
    query: string;
    category?: Category;
    keywords?: string[];
    limit?: number;
    minScore?: number;
  }): SearchResult[] {
    let results = this.searchDocuments(
      options.query,
      options.limit || 10,
      options.category
    );

    // Filter by keywords if provided
    if (options.keywords && options.keywords.length > 0) {
      results = results.filter(result => {
        return options.keywords!.some(keyword =>
          result.document.hasKeyword(keyword)
        );
      });
    }

    // Filter by minimum score
    if (options.minScore !== undefined) {
      results = results.filter(result => result.score >= options.minScore!);
    }

    return results;
  }

  // Get similar documents based on keywords
  getSimilarDocuments(
    document: BaaSDocument,
    limit: number = 3
  ): BaaSDocument[] {
    const targetKeywords = Array.from(document.getKeywords());
    const similarities: Array<{ doc: BaaSDocument; score: number }> = [];

    for (const doc of this.documents) {
      if (doc.getId() === document.getId()) continue;

      const docKeywords = Array.from(doc.getKeywords());
      const intersection = targetKeywords.filter(keyword =>
        docKeywords.includes(keyword)
      );
      
      const union = new Set([...targetKeywords, ...docKeywords]);
      const similarity = intersection.length / union.size;

      if (similarity > 0.1) {
        similarities.push({ doc, score: similarity });
      }
    }

    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.doc);
  }
}