export class BaaSSynonymDictionary {
  private readonly dictionary: Record<string, string[]> = {
    // BaaS 핵심 인증 기능
    "로그인": ["login", "signin", "auth"],
    "로그아웃": ["logout", "signout"],
    "회원가입": ["signup", "register", "join"],
    "인증": ["authentication", "auth"],
    
    // 사용자 정보 (모두 info API로 매핑)
    "내정보": ["info", "myinfo", "account info"],
    "프로필": ["profile", "user profile", "info"],
    "사용자정보": ["user info", "account", "info"],
    "마이페이지": ["mypage", "my page", "info"],
    "계정정보": ["account info", "info"],
    
    // 인증 방식
    "토큰": ["token", "jwt", "bearer"],
    "쿠키": ["cookie", "session"],
    
    // 프레임워크 (코드 생성용)
    "React": ["react", "리액트", "jsx", "tsx"],
    "Vue": ["vue", "뷰", "vuejs"],
    "Next.js": ["nextjs", "next", "넥스트"],
    "바닐라": ["vanilla", "javascript", "js"],
    
    // 기본 CRUD (BaaS API와 매핑)
    "생성": ["create", "add", "new"],
    "조회": ["get", "fetch", "read"],
    "수정": ["update", "edit", "modify"],
    "삭제": ["delete", "remove"],
  };

  /**
   * 특정 용어의 동의어 목록 반환
   */
  getSynonyms(term: string): string[] {
    const normalizedTerm = term.toLowerCase().trim();
    return this.dictionary[normalizedTerm] || [];
  }

  /**
   * 용어 목록을 동의어로 확장
   */
  expandWithSynonyms(terms: string[]): string[] {
    const expandedTerms = new Set<string>();
    
    for (const term of terms) {
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