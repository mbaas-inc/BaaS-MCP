import {BM25Result} from "./baas-bm25-calculator.js";
import {BaaSDocument} from "./baas-document.js";

/**
 * 키워드별 가중치 설정 (BaaS 핵심 기능만)
 */
const KEYWORD_WEIGHTS: Record<string, number> = {
  // BaaS 핵심 기능
  "login": 1.5,
  "signup": 1.5,
  "auth": 1.3,
  "authentication": 1.3,
  "info": 1.3,

  // 한국어 인증 키워드 (높은 우선순위)
  "인증": 1.5,
  "로그인": 1.5,
  "회원가입": 1.5,
  "사용자정보": 1.3,
  "사용자": 1.3,

  // 인증 관련
  "cookie": 1.2,
  "token": 1.2,
  "user": 1.2,
  "profile": 1.2,
  "account": 1.2,
  "register": 1.2,
  "signin": 1.2,

  // 기본값
  "default": 1.0,
} as const;

/**
 * 컨텍스트별 가중치 설정 (단순화)
 */
const CONTEXT_WEIGHTS = {
  title: 1.5,       // 제목 매치
  description: 1.2, // 설명 매치
  content: 1.0,     // 일반 내용 매치
} as const;

export class BaaSWeightCalculator {
  private readonly keywordWeights: Record<string, number>;

  constructor(
    customKeywordWeights?: Partial<Record<string, number>>
  ) {
    this.keywordWeights = { ...KEYWORD_WEIGHTS, ...customKeywordWeights } as Record<string, number>;
  }

  /**
   * BM25 결과에 키워드 가중치를 적용하고 재정렬
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
            keywordWeight: 1.0,
            contextWeight: 1.0,
            finalScore: result.score,
          };
        }

        const keywordWeight = this.calculateKeywordWeight(document, queryTerms);
        const contextWeight = this.calculateContextWeight(document, queryTerms);

        const finalScore = result.score * keywordWeight * contextWeight;

        return {
          ...result,
          keywordWeight,
          contextWeight,
          finalScore,
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);
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
  keywordWeight: number;
  contextWeight: number;
  finalScore: number;
}