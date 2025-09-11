import { z } from "zod";
import { SearchMode } from "../constants/search-mode.js";

/**
 * 문서 검색 도구 스키마
 */
export const SearchDocumentsSchema = {
  keywords: z
    .array(z.string())
    .describe("검색할 키워드 배열. 예: ['로그인', 'React'], ['JWT', '토큰'], ['쿠키', '설정']"),
  query: z
    .string()
    .optional()
    .describe("키워드 배열 대신 사용할 검색 문장 (비권장). 예: 'React 로그인 컴포넌트'"),
  category: z
    .enum(["api", "templates", "security", "examples", "dev", "frameworks", "errors", "config"])
    .optional()
    .describe("검색할 문서 카테고리 (선택사항). api, templates, security, examples, dev, frameworks, errors, config 중 선택"),
  searchMode: z
    .nativeEnum(SearchMode)
    .default(SearchMode.BALANCED)
    .optional()
    .describe(`검색 모드에 따라 결과의 관련성과 정확도가 달라집니다.
    
검색 모드:
- broad: 폭넓은 결과 (관련성 낮아도 포함, 개념 탐색 시)
- balanced: 균형잡힌 결과 (일반적인 검색, 기본값)
- precise: 정확한 결과만 (정확한 답변 필요 시)`),
  limit: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(5)
    .optional()
    .describe("반환할 검색 결과 수 (기본값: 5, 최대: 10)")
};

/**
 * ID로 문서 조회 도구 스키마
 */
export const GetDocumentByIdSchema = {
  id: z
    .number()
    .int()
    .describe("조회할 문서의 ID (search-documents 결과에서 확인 가능)"),
  includeMetadata: z
    .boolean()
    .default(false)
    .optional()
    .describe("문서 메타데이터 포함 여부 (기본값: false)")
};


// 타입 정의 (Toss MCP 방식)
export type SearchDocumentsParams = {
  keywords: string[];
  query?: string;
  category?: "api" | "templates" | "security" | "examples" | "dev" | "frameworks" | "errors" | "config";
  searchMode?: SearchMode;
  limit?: number;
};

export type GetDocumentByIdParams = {
  id: number;
  includeMetadata?: boolean;
};

