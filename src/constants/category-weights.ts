import { Category } from "../document/types.js";

/**
 * BaaS 도메인별 카테고리 가중치 설정 (단순화)
 * 1.0 = 기본값, 0.5 = 50% 감소, 1.2 = 20% 증가
 */
export const CATEGORY_WEIGHTS: Record<Category, number> = {
  api: 1.3,        // API 문서 최우선 (BaaS의 핵심)
  templates: 1.2,  // 코드 템플릿 높은 우선순위
  security: 1.1,   // 보안 관련 문서
  examples: 1.0,   // 예제 문서 기본값
  frameworks: 1.0, // 프레임워크 가이드
  dev: 1.0,        // 개발 가이드
  config: 0.9,     // 설정 관련 문서
  errors: 0.8,     // 에러 관련 문서
  unknown: 0.7,    // 분류되지 않은 문서
} as const;

/**
 * 키워드별 가중치 설정 (BaaS 핵심 기능만)
 */
export const KEYWORD_WEIGHTS: Record<string, number> = {
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
export const CONTEXT_WEIGHTS = {
  title: 1.5,       // 제목 매치
  description: 1.2, // 설명 매치
  content: 1.0,     // 일반 내용 매치
} as const;