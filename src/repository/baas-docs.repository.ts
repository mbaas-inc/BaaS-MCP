import {BaaSDocument} from "../document/baas-document.js";
import {BaaSBM25Calculator} from "../document/baas-bm25-calculator.js";
import {BaaSWeightCalculator, WeightedBM25Result} from "../document/baas-weight-calculator.js";
import {BaaSSynonymDictionary} from "../document/baas-synonym-dictionary.js";
import {SearchMode} from "../constants/search-mode.js";

export interface SearchResult {
  document: BaaSDocument;
  score: number;
  relevantChunks: string[];
  keywordWeight?: number;
  contextWeight?: number;
  chunkId?: number;
}

export interface AdvancedSearchOptions {
  query: string;
  keywords?: string[];
  limit?: number;
  minScore?: number;
  searchMode?: SearchMode;
  useWeights?: boolean;
  useSynonyms?: boolean;
}

export class BaaSDocsRepository {
  private documentFreq: Map<string, number> = new Map();
  private bm25Calculator: BaaSBM25Calculator;
  private weightCalculator: BaaSWeightCalculator;
  private synonymDictionary: BaaSSynonymDictionary;
  
  constructor(private readonly documents: BaaSDocument[]) {
    this.buildDocumentFrequency();
    this.bm25Calculator = new BaaSBM25Calculator(documents);
    this.weightCalculator = new BaaSWeightCalculator();
    this.synonymDictionary = new BaaSSynonymDictionary();
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

  /**
   * 새로운 고급 검색 메서드 (BM25 + 가중치 + 동의어 사전 사용)
   */
  searchDocumentsAdvanced(options: AdvancedSearchOptions): SearchResult[] {
    if (!options.query || typeof options.query !== 'string') {
      return [];
    }

    // 쿼리 전처리 및 동의어 확장
    let queryTerms = this.preprocessQuery(options.query);
    if (options.useSynonyms !== false) {
      queryTerms = this.synonymDictionary.expandWithSynonyms(queryTerms);
    }

    const searchMode = options.searchMode || SearchMode.BALANCED;
    
    // BM25 계산
    let bm25Results = this.bm25Calculator.calculate(queryTerms, searchMode);

    // 가중치 적용
    let weightedResults: WeightedBM25Result[] = bm25Results.map(result => ({
      ...result,
      categoryWeight: 1.0,
      keywordWeight: 1.0,
      contextWeight: 1.0,
      finalScore: result.score,
    }));

    if (options.useWeights !== false) {
      weightedResults = this.weightCalculator.apply(bm25Results, this.documents, queryTerms);
    }

    // SearchResult 형태로 변환
    const searchResults: SearchResult[] = weightedResults
      .map(result => {
        const document = this.getDocumentById(result.id);
        if (!document) return null;

        const relevantChunks = document.getRelevantChunks(queryTerms, 3);
        
        return {
          document,
          score: result.finalScore,
          relevantChunks,
          keywordWeight: result.keywordWeight,
          contextWeight: result.contextWeight,
          chunkId: result.chunkId,
        };
      })
      .filter(result => result !== null) as SearchResult[];

    // 키워드 필터링 - BM25 검색 시에는 이미 키워드 기반 검색이 되었으므로 추가 필터링 불필요
    let filteredResults = searchResults;
    // keywords는 이미 BM25 검색에서 query로 사용되었으므로 별도 필터링 제거
    // if (options.keywords && options.keywords.length > 0) {
    //   filteredResults = searchResults.filter(result => {
    //     return options.keywords!.some(keyword =>
    //       result.document.hasKeyword(keyword)
    //     );
    //   });
    // }

    // 최소 점수 필터링
    if (options.minScore !== undefined) {
      filteredResults = filteredResults.filter(result => 
        result.score >= options.minScore!
      );
    }

    // 결과 제한
    const limit = options.limit || 5;
    return filteredResults.slice(0, limit);
  }

  searchDocuments(
    query: string,
    limit: number = 5
  ): SearchResult[] {
    // query validation
    if (!query || typeof query !== 'string') {
      return [];
    }
    
    const queryTerms = this.preprocessQuery(query);
    
    const documentsToSearch = this.documents;

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


  getTotalDocuments(): number {
    return this.documents.length;
  }

  private preprocessQuery(query: string): string[] {
    // query validation
    if (!query || typeof query !== 'string') {
      return [];
    }
    
    // Normalize and tokenize query
    const normalized = query
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .trim();

    const terms = normalized
      .split(/\s+/)
      .filter(term => term.length > 1);

    return terms;
  }

  // Advanced search with multiple filters (기존 메서드와 호환성 유지)
  advancedSearch(options: {
    query: string;
    keywords?: string[];
    limit?: number;
    minScore?: number;
  }): SearchResult[] {
    // 새로운 고급 검색 메서드로 위임
    return this.searchDocumentsAdvanced({
      query: options.query,
      keywords: options.keywords,
      limit: options.limit || 10,
      minScore: options.minScore,
      searchMode: SearchMode.BALANCED,
      useWeights: true,
      useSynonyms: true,
    });
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