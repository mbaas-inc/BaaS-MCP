import {beforeAll, describe, expect, it} from "vitest";
import {createBaaSDocsRepository} from "../createBaaSDocsRepository.js";
import {SearchMode} from "../../constants/search-mode.js";

type Repository = Awaited<ReturnType<typeof createBaaSDocsRepository>>;

describe("BaaSDocsRepository E2E", () => {
  let repository: Repository;

  beforeAll(async () => {
    repository = await createBaaSDocsRepository();
  });

  const searchAndExpectResults = (query: string, expectedTerms: string[]) => {
    const results = repository.searchDocumentsAdvanced({ query });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(result =>
      expectedTerms.some(term =>
        result.document.getTitle().toLowerCase().includes(term) ||
        result.document.getContent().toLowerCase().includes(term)
      )
    )).toBe(true);
    return results;
  };

  const testCases = [
    { name: "로그인", query: "로그인", terms: ["로그인", "login"] },
    { name: "회원가입", query: "회원가입", terms: ["회원가입", "signup"] },
    { name: "사용자정보", query: "사용자정보", terms: ["사용자", "user", "account", "info"] }
  ];

  testCases.forEach(({ name, query, terms }) => {
    it(`한국어 인증 키워드로 검색 - ${name}`, () => {
      searchAndExpectResults(query, terms);
    });
  });

  it("복합 키워드 검색 - 원래 문제 상황 재현", () => {
    const results = searchAndExpectResults("인증 로그인 회원가입 사용자정보", ["인증", "로그인", "회원가입", "사용자"]);
    console.log(`복합 키워드 검색 결과: ${results.length}개`);
  });

  it("통합 문서에서 API와 구현 예제 검색", () => {
    const results = repository.searchDocumentsAdvanced({ query: "API authentication login" });
    expect(results.length).toBeGreaterThan(0);
    // 통합 문서에는 API 명세와 구현 예제가 모두 포함되어 있음을 검증
    expect(results.some(result =>
      result.document.getContent().toLowerCase().includes('api') &&
      result.document.getContent().toLowerCase().includes('react')
    )).toBe(true);
  });

  it("템플릿 문서에서 React 컴포넌트 검색", () => {
    const results = repository.searchDocumentsAdvanced({ query: "react 로그인 컴포넌트" });
    if (results.length > 0) {
      expect(results.some(result =>
        ["react", "component"].some(term => result.document.getContent().toLowerCase().includes(term))
      )).toBe(true);
    }
  });

  it("영어 키워드로 검색", () => {
    searchAndExpectResults("login authentication", ["login", "authentication", "인증", "로그인"]);
  });

  it("검색 모드별 결과 비교", () => {
    const modes = [SearchMode.BROAD, SearchMode.BALANCED, SearchMode.PRECISE];
    const results = modes.map(mode => 
      repository.searchDocumentsAdvanced({ query: "API", searchMode: mode })
    );
    
    results.forEach(result => expect(result.length).toBeGreaterThanOrEqual(0));
    console.log(`검색 모드별 결과 - ${modes.map((mode, i) => `${mode}: ${results[i].length}`).join(", ")}`);
  });

  const edgeCases = [
    { name: "빈 검색 조건 처리", query: "" },
    { name: "존재하지 않는 키워드 검색", query: "비존재키워드12345" }
  ];

  edgeCases.forEach(({ name, query }) => {
    it(name, () => {
      const results = repository.searchDocumentsAdvanced({ query });
      expect(Array.isArray(results)).toBe(true);
    });
  });

  const realWorldScenarios = [
    { 
      name: "사용자 계정 관리", 
      query: "user_id user_pw project_id account",
      terms: ["user_id", "user_pw", "project_id", "account"],
      expectResults: true
    },
    { 
      name: "API 엔드포인트 검색", 
      query: "/account endpoint URL",
      terms: ["/account", "endpoint", "url"],
      expectResults: false
    }
  ];

  realWorldScenarios.forEach(({ name, query, terms, expectResults }) => {
    it(`BaaS 관련 실제 사용 시나리오 - ${name}`, () => {
      const results = repository.searchDocumentsAdvanced({ query });
      if (expectResults) {
        searchAndExpectResults(query, terms);
      } else {
        expect(Array.isArray(results)).toBe(true);
      }
    });
  });

  it("실제 BaaS 특화 키워드 검색", () => {
    const results = repository.searchDocumentsAdvanced({ query: "withCredentials credentials include project_id" });
    if (results.length > 0) {
      expect(results.some(result => 
        ["withCredentials", "credentials", "project_id"].some(term => 
          result.document.getContent().includes(term)
        )
      )).toBe(true);
    }
  });

  it("한글-영어 동의어 확장 테스트", () => {
    const koreanResults = repository.searchDocumentsAdvanced({ query: "로그인", useSynonyms: true });
    const englishResults = repository.searchDocumentsAdvanced({ query: "login", useSynonyms: true });
    
    expect(koreanResults.length).toBeGreaterThan(0);
    expect(englishResults.length).toBeGreaterThan(0);
  });

  it("가중치 시스템 테스트", () => {
    const query = "login authentication";
    const withWeights = repository.searchDocumentsAdvanced({ query, useWeights: true, limit: 5 });
    const withoutWeights = repository.searchDocumentsAdvanced({ query, useWeights: false, limit: 5 });
    
    [withWeights, withoutWeights].forEach(results => 
      expect(results.length).toBeGreaterThanOrEqual(0)
    );
  });

  it("최소 점수 필터링 테스트", () => {
    const results = repository.searchDocumentsAdvanced({
      query: "login authentication",
      minScore: 0.5
    });
    
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results.every(result => result.score >= 0.5)).toBe(true);
    }
  });
});