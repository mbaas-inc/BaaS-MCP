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
  limit?: number;
  minScore?: number;
  searchMode?: SearchMode;
  useWeights?: boolean;
  useSynonyms?: boolean;
}

export class BaaSDocsRepository {
  private bm25Calculator: BaaSBM25Calculator;
  private weightCalculator: BaaSWeightCalculator;
  private synonymDictionary: BaaSSynonymDictionary;

  /**
   * @param featureDocs - 검색 가능한 기능 문서 (auth-operations, integration)
   * @param commonDocs - 자동 제공되는 공통 규칙 문서 (common/)
   */
  constructor(
    private readonly featureDocs: BaaSDocument[],
    private readonly commonDocs: BaaSDocument[] = []
  ) {
    // 검색은 featureDocs만 대상으로
    this.bm25Calculator = new BaaSBM25Calculator(featureDocs);
    this.weightCalculator = new BaaSWeightCalculator();
    this.synonymDictionary = new BaaSSynonymDictionary();
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
      weightedResults = this.weightCalculator.apply(bm25Results, this.featureDocs, queryTerms);
    }

    // SearchResult 형태로 변환 (featureDocs에서만 검색)
    const searchResults: SearchResult[] = weightedResults
      .map(result => {
        const document = this.featureDocs.find(doc => doc.getId() === result.id);
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

    // 최소 점수 필터링
    let filteredResults = searchResults;
    if (options.minScore !== undefined) {
      filteredResults = filteredResults.filter(result =>
        result.score >= options.minScore!
      );
    }

    // 결과 제한
    const limit = options.limit || 5;
    return filteredResults.slice(0, limit);
  }

  getDocumentById(id: number): BaaSDocument | undefined {
    // Feature와 common 문서 모두에서 검색
    const allDocs = [...this.featureDocs, ...this.commonDocs];
    return allDocs.find(doc => doc.getId() === id);
  }

  getTotalDocuments(): number {
    return this.featureDocs.length + this.commonDocs.length;
  }

  /**
   * 검색 가능한 기능 문서 수 반환
   */
  getFeatureDocumentsCount(): number {
    return this.featureDocs.length;
  }

  /**
   * Common 문서들을 반환합니다.
   *
   * **중요**: Common 문서는 검색되지 않으며, get-project-config를 통해서만 제공됩니다.
   *
   * @returns security.md, errors.md, state-management.md 문서들
   */
  getCommonDocs(): BaaSDocument[] {
    return this.commonDocs;
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

  // Get similar documents based on keywords
  getSimilarDocuments(
    document: BaaSDocument,
    limit: number = 3
  ): BaaSDocument[] {
    const targetKeywords = Array.from(document.getKeywords());
    const similarities: Array<{ doc: BaaSDocument; score: number }> = [];

    // Feature와 common 문서 모두에서 검색
    const allDocs = [...this.featureDocs, ...this.commonDocs];

    for (const doc of allDocs) {
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