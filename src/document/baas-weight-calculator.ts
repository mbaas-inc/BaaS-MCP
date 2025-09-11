import { Category } from "./types.js";
import { BM25Result } from "./baas-bm25-calculator.js";
import { BaaSDocument } from "./baas-document.js";
import { CATEGORY_WEIGHTS, KEYWORD_WEIGHTS, CONTEXT_WEIGHTS } from "../constants/category-weights.js";

export class BaaSWeightCalculator {
  private readonly categoryWeights: Record<Category, number>;
  private readonly keywordWeights: Record<string, number>;

  constructor(
    customCategoryWeights?: Partial<Record<Category, number>>,
    customKeywordWeights?: Partial<Record<string, number>>
  ) {
    this.categoryWeights = { ...CATEGORY_WEIGHTS, ...customCategoryWeights } as Record<Category, number>;
    this.keywordWeights = { ...KEYWORD_WEIGHTS, ...customKeywordWeights } as Record<string, number>;
  }

  /**
   * BM25 결과에 카테고리 및 키워드 가중치를 적용하고 재정렬
   */
  apply(
    results: BM25Result[], 
    documents: BaaSDocument[], 
    queryTerms: string[]
  ): WeightedBM25Result[] {
    const documentMap = this.createDocumentMap(documents);

    return results
      .map((result) => {
        const document = documentMap.get(result.id);
        if (!document) {
          console.warn(`Document not found for id: ${result.id}`);
          return {
            ...result,
            categoryWeight: 1.0,
            keywordWeight: 1.0,
            contextWeight: 1.0,
            finalScore: result.score,
          };
        }

        const categoryWeight = this.getCategoryWeight(document.getCategory());
        const keywordWeight = this.calculateKeywordWeight(document, queryTerms);
        const contextWeight = this.calculateContextWeight(document, queryTerms);
        
        const finalScore = result.score * categoryWeight * keywordWeight * contextWeight;

        return {
          ...result,
          categoryWeight,
          keywordWeight,
          contextWeight,
          finalScore,
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * 카테고리별 가중치 조회
   */
  private getCategoryWeight(category: Category): number {
    return this.categoryWeights[category] || 1.0;
  }

  /**
   * 키워드 매치 기반 가중치 계산
   */
  private calculateKeywordWeight(document: BaaSDocument, queryTerms: string[]): number {
    let totalWeight = 1.0;
    
    for (const term of queryTerms) {
      const normalizedTerm = term.toLowerCase().trim();
      const weight = this.keywordWeights[normalizedTerm] || this.keywordWeights["default"];
      
      // 문서에 해당 키워드가 있는 경우에만 가중치 적용
      if (document.hasKeyword(normalizedTerm)) {
        totalWeight *= weight;
      }
    }
    
    return Math.min(totalWeight, 2.0); // 최대 2배로 제한
  }

  /**
   * 컨텍스트별 가중치 계산 (단순화)
   */
  private calculateContextWeight(document: BaaSDocument, queryTerms: string[]): number {
    let contextWeight = 1.0;
    
    const title = document.getTitle().toLowerCase();
    const description = document.getDescription().toLowerCase();
    
    for (const term of queryTerms) {
      const normalizedTerm = term.toLowerCase().trim();
      
      // 제목에서 매치
      if (title.includes(normalizedTerm)) {
        contextWeight *= CONTEXT_WEIGHTS.title;
      }
      
      // 설명에서 매치  
      if (description.includes(normalizedTerm)) {
        contextWeight *= CONTEXT_WEIGHTS.description;
      }
    }
    
    return Math.min(contextWeight, 2.0); // 최대 2배로 제한
  }

  /**
   * 특정 카테고리의 가중치 업데이트
   */
  updateCategoryWeight(category: Category, weight: number): void {
    this.categoryWeights[category] = weight;
  }

  /**
   * 특정 키워드의 가중치 업데이트
   */
  updateKeywordWeight(keyword: string, weight: number): void {
    this.keywordWeights[keyword.toLowerCase()] = weight;
  }

  /**
   * 현재 카테고리 가중치 설정 조회
   */
  getCategoryWeights(): Readonly<Record<Category, number>> {
    return this.categoryWeights;
  }

  /**
   * 현재 키워드 가중치 설정 조회
   */
  getKeywordWeights(): Readonly<Record<string, number>> {
    return this.keywordWeights;
  }

  /**
   * 문서 배열을 ID 기반 Map으로 변환 (성능 최적화)
   */
  private createDocumentMap(documents: BaaSDocument[]): Map<number, BaaSDocument> {
    const map = new Map<number, BaaSDocument>();
    for (const doc of documents) {
      map.set(doc.getId(), doc);
    }
    return map;
  }
}

export interface WeightedBM25Result extends BM25Result {
  categoryWeight: number;
  keywordWeight: number;
  contextWeight: number;
  finalScore: number;
}