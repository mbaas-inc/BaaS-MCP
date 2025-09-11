/**
 * MCP 파라미터 파싱 유틸리티
 * Claude Desktop에서 배열/객체가 문자열로 전달되는 문제를 해결
 */

/**
 * keywords 파라미터를 안전하게 파싱
 */
export function parseKeywords(keywords: any): string[] {
  // 이미 배열인 경우
  if (Array.isArray(keywords)) {
    return keywords.filter(k => typeof k === 'string' && k.trim().length > 0);
  }
  
  // 문자열로 전달된 JSON 배열인 경우
  if (typeof keywords === 'string') {
    const trimmed = keywords.trim();
    
    // JSON 배열 형태인지 확인
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter(k => typeof k === 'string' && k.trim().length > 0);
        }
      } catch (error) {
        console.error('Failed to parse keywords JSON:', trimmed, error);
      }
    }
    
    // 단일 문자열을 배열로 변환
    if (trimmed.length > 0) {
      return [trimmed];
    }
  }
  
  return [];
}

/**
 * query 파라미터를 안전하게 파싱
 */
export function parseQuery(query: any): string {
  if (typeof query === 'string') {
    return query.trim();
  }
  
  return '';
}

/**
 * category 파라미터를 안전하게 파싱
 */
export function parseCategory(category: any): string | undefined {
  if (typeof category === 'string' && category.trim().length > 0) {
    return category.trim();
  }
  
  return undefined;
}

/**
 * 디버깅을 위한 파라미터 로깅
 */
export function logParameters(toolName: string, args: any): void {
  console.error(`[${toolName}] Received parameters:`, {
    raw: args,
    types: Object.keys(args).reduce((acc, key) => {
      acc[key] = typeof args[key];
      return acc;
    }, {} as Record<string, string>)
  });
}