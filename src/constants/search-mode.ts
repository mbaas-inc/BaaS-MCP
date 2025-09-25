export enum SearchMode {
  BROAD = "broad",
  BALANCED = "balanced", 
  PRECISE = "precise",
}

export type BM25Config = {
  k1: number;
  b: number;
};

export const BM25_CONFIGS: Record<SearchMode, BM25Config> = {
  broad: {
    k1: 1.0, // 낮은 k1 = 용어 빈도에 덜 민감
    b: 0.5, // 낮은 b = 문서 길이에 덜 민감
  },
  balanced: {
    k1: 1.2, // 표준 BM25 값
    b: 0.75, // 표준 BM25 값
  },
  precise: {
    k1: 1.5, // 높은 k1 = 용어 빈도에 더 민감
    b: 0.9, // 높은 b = 문서 길이에 더 민감
  },
};

export const MIN_SCORE_RATIO = {
  broad: 0.3,    // 최고점의 21%로 매핑 (0.3 * 0.7 = 0.21)
  balanced: 0.7, // 최고점의 49%로 매핑 (0.7 * 0.7 = 0.49)
  precise: 1.0,  // 최고점의 70%로 매핑 (1.0 * 0.7 = 0.70)
};