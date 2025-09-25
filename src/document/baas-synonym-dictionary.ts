export class BaaSSynonymDictionary {
  private readonly dictionary: Record<string, string[]> = {
    // BaaS 핵심 인증 기능
    "로그인": ["login", "signin", "sign-in", "auth", "인증", "로그인페이지", "login page"],
    "로그아웃": ["logout", "signout", "sign-out"],
    "회원가입": ["signup", "register", "join", "registration", "가입", "회원가입페이지", "signup page"],
    "인증": ["authentication", "auth", "login", "signin"],
    
    // 사용자 정보 (모두 info API로 매핑)
    "내정보": ["info", "myinfo", "account info", "user info"],
    "프로필": ["profile", "user profile", "info"],
    "사용자정보": ["user info", "account", "info", "user", "profile", "account info", "user data"],
    "마이페이지": ["mypage", "my page", "info"],
    "계정정보": ["account info", "info", "account"],
    "사용자": ["user", "account", "member", "info", "profile"],
    
    // 인증 방식 및 보안
    "토큰": ["token", "jwt", "bearer", "access_token", "authorization"],
    "쿠키": ["cookie", "session", "credentials", "withCredentials"],
    "보안": ["security", "secure", "safety"],
    "에러": ["error", "exception", "오류", "실패"],
    "검증": ["validation", "verify", "check"],
    
    // 프레임워크 및 기술 스택
    "react": ["React", "리액트", "jsx", "tsx", "컴포넌트", "component"],
    "nextjs": ["Next.js", "next", "넥스트", "서버사이드"],
    "vanilla": ["바닐라", "javascript", "js", "html", "순수 자바스크립트"],
    "typescript": ["ts", "타입스크립트", "type"],
    "tailwind": ["tailwindcss", "css", "스타일링"],
    
    // 페이지 및 컴포넌트
    "페이지": ["page", "화면", "screen"],
    "컴포넌트": ["component", "comp", "요소", "element"],
    "폼": ["form", "양식", "입력폼"],
    "버튼": ["button", "btn", "클릭"],
    "입력": ["input", "field", "텍스트필드"],
    
    // API 및 통신
    "api": ["API", "endpoint", "서버", "backend"],
    "요청": ["request", "call", "호출"],
    "응답": ["response", "result", "결과"],
    "데이터": ["data", "정보", "정보"],
    
    // 기본 CRUD (BaaS API와 매핑)
    "생성": ["create", "add", "new", "추가"],
    "조회": ["get", "fetch", "read", "가져오기"],
    "수정": ["update", "edit", "modify", "변경"],
    "삭제": ["delete", "remove", "제거"],
    
    // 상태 및 처리
    "로딩": ["loading", "로드", "처리중"],
    "성공": ["success", "완료", "성공적"],
    "실패": ["failure", "fail", "에러", "오류"],
    
    // 설정 및 구성
    "설정": ["config", "configuration", "setup"],
    "환경": ["environment", "env"],
    "프로젝트": ["project", "app", "application"],
    
    // 한국어 특화 동의어
    "만들기": ["create", "build", "구현", "개발"],
    "구현": ["implement", "develop", "만들기", "개발"],
    "사용": ["use", "usage", "활용"],
    "예시": ["example", "샘플", "sample", "데모"],
    "가이드": ["guide", "tutorial", "설명서", "문서"]
  };

  /**
   * 특정 용어의 동의어 목록 반환
   */
  getSynonyms(term: string): string[] {
    if (!term) return [];
    const normalizedTerm = term.toLowerCase().trim();
    return this.dictionary[normalizedTerm] || [];
  }

  /**
   * 용어 목록을 동의어로 확장
   */
  expandWithSynonyms(terms: string[]): string[] {
    const expandedTerms = new Set<string>();
    
    for (const term of terms) {
      if (!term) continue;
      const normalizedTerm = term.toLowerCase().trim();
      expandedTerms.add(normalizedTerm);
      
      // 해당 용어의 동의어들 추가
      const synonyms = this.getSynonyms(normalizedTerm);
      synonyms.forEach(synonym => expandedTerms.add(synonym.toLowerCase()));
      
      // 역방향 검색: 다른 용어의 동의어로 등록된 경우
      for (const [key, synonymList] of Object.entries(this.dictionary)) {
        if (synonymList.some(s => s.toLowerCase() === normalizedTerm)) {
          expandedTerms.add(key.toLowerCase());
          // 해당 키의 다른 동의어들도 추가
          synonymList.forEach(s => expandedTerms.add(s.toLowerCase()));
        }
      }
    }
    
    return Array.from(expandedTerms);
  }

  /**
   * 새로운 동의어 관계 추가
   */
  addSynonym(term: string, synonyms: string[]): void {
    const normalizedTerm = term.toLowerCase().trim();
    const normalizedSynonyms = synonyms.map(s => s.toLowerCase().trim());
    
    if (this.dictionary[normalizedTerm]) {
      // 기존 동의어에 추가
      this.dictionary[normalizedTerm].push(...normalizedSynonyms);
      // 중복 제거
      this.dictionary[normalizedTerm] = [...new Set(this.dictionary[normalizedTerm])];
    } else {
      // 새로운 동의어 관계 생성
      this.dictionary[normalizedTerm] = normalizedSynonyms;
    }
  }

  /**
   * 동의어 관계 제거
   */
  removeSynonym(term: string, synonym: string): void {
    const normalizedTerm = term.toLowerCase().trim();
    const normalizedSynonym = synonym.toLowerCase().trim();
    
    if (this.dictionary[normalizedTerm]) {
      this.dictionary[normalizedTerm] = this.dictionary[normalizedTerm]
        .filter(s => s.toLowerCase() !== normalizedSynonym);
      
      // 빈 배열이면 아예 제거
      if (this.dictionary[normalizedTerm].length === 0) {
        delete this.dictionary[normalizedTerm];
      }
    }
  }

  /**
   * 특정 용어가 동의어 사전에 있는지 확인
   */
  hasTerm(term: string): boolean {
    const normalizedTerm = term.toLowerCase().trim();
    
    // 직접 키로 존재하는지 확인
    if (this.dictionary[normalizedTerm]) {
      return true;
    }
    
    // 다른 용어의 동의어로 존재하는지 확인
    for (const synonymList of Object.values(this.dictionary)) {
      if (synonymList.some(s => s.toLowerCase() === normalizedTerm)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 동의어 사전의 모든 용어 반환
   */
  getAllTerms(): string[] {
    const allTerms = new Set<string>();
    
    // 키들 추가
    Object.keys(this.dictionary).forEach(key => allTerms.add(key));
    
    // 동의어들 추가
    Object.values(this.dictionary).forEach(synonyms => {
      synonyms.forEach(synonym => allTerms.add(synonym.toLowerCase()));
    });
    
    return Array.from(allTerms).sort();
  }

  /**
   * 동의어 사전 통계 정보
   */
  getStats(): { totalTerms: number; totalSynonyms: number; avgSynonymsPerTerm: number } {
    const totalTerms = Object.keys(this.dictionary).length;
    const totalSynonyms = Object.values(this.dictionary).reduce((sum, arr) => sum + arr.length, 0);
    const avgSynonymsPerTerm = totalTerms > 0 ? totalSynonyms / totalTerms : 0;
    
    return {
      totalTerms,
      totalSynonyms,
      avgSynonymsPerTerm: Math.round(avgSynonymsPerTerm * 100) / 100
    };
  }
}