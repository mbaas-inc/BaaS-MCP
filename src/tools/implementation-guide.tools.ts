import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { BaaSDocsRepository } from "../repository/baas-docs.repository.js";
import { SearchMode } from "../constants/search-mode.js";
import { parseKeywords, logParameters } from "../utils/parameter-parser.js";

/**
 * 키워드 배열에서 feature와 framework 파라미터를 자동 추론
 */
function inferParametersFromKeywords(keywords: string[]): {
  feature?: string;
  framework?: string;
} {
  const featureMap: Record<string, string> = {
    '로그인': 'login',
    'login': 'login',
    'signin': 'login',
    'sign-in': 'login',
    '인증': 'login',
    '회원가입': 'signup',
    'signup': 'signup',
    'register': 'signup',
    'registration': 'signup',
    '가입': 'signup',
    '내정보': 'info',
    'info': 'info',
    'profile': 'info',
    '프로필': 'info',
    '로그아웃': 'logout',
    'logout': 'logout',
    'signout': 'logout',
    'sign-out': 'logout'
  };
  
  const frameworkMap: Record<string, string> = {
    'html': 'vanilla',
    'vanilla': 'vanilla',
    'javascript': 'vanilla',
    'js': 'vanilla',
    'react': 'react',
    '리액트': 'react',
    'vue': 'vue',
    'vuejs': 'vue',
    '뷰': 'vue',
    'nextjs': 'nextjs',
    'next.js': 'nextjs',
    'next': 'nextjs',
    '넥스트': 'nextjs'
  };
  
  let feature: string | undefined;
  let framework: string | undefined;
  
  for (const keyword of keywords) {
    const lower = keyword.toLowerCase().trim();
    
    if (!feature && featureMap[lower]) {
      feature = featureMap[lower];
    }
    
    if (!framework && frameworkMap[lower]) {
      framework = frameworkMap[lower];
    }
    
    // 이미 둘 다 찾았으면 중단
    if (feature && framework) {
      break;
    }
  }
  
  return { feature, framework };
}

export interface ImplementationGuideOptions {
  keywords?: string[];
  feature?: 'login' | 'signup' | 'info' | 'logout';
  framework?: 'react' | 'vue' | 'nextjs' | 'vanilla';
}

export function createImplementationGuideTool(repository: BaaSDocsRepository, projectId?: string | null) {
  return {
    inputSchema: {
      type: "object" as const,
      properties: {
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "구현 키워드 배열. 예: ['로그인', 'HTML'], ['회원가입', 'React'], ['인증', 'Vue']"
        },
        feature: {
          type: "string",
          enum: ["login", "signup", "info", "logout"],
          description: "구현할 BaaS 기능 (keywords에서 자동 추출 시도). login(로그인), signup(회원가입), info(내정보), logout(로그아웃)"
        },
        framework: {
          type: "string", 
          enum: ["react", "vue", "nextjs", "vanilla"],
          description: "사용할 프레임워크 (keywords에서 자동 추출 시도). react, vue, nextjs, vanilla(HTML) 중 선택"
        }
      },
      required: []
    },
    handler: async (args: any): Promise<CallToolResult> => {
      try {
        // 디버깅을 위한 파라미터 로깅
        logParameters('get-implementation-guide', args);
        
        // 안전하게 파라미터 파싱
        const keywords = parseKeywords(args.keywords);
        let feature = typeof args.feature === 'string' ? args.feature : undefined;
        let framework = typeof args.framework === 'string' ? args.framework : undefined;

        // 키워드 배열이 있으면 파라미터 자동 추론
        if (keywords.length > 0) {
          const inferred = inferParametersFromKeywords(keywords);
          feature = feature || inferred.feature;
          framework = framework || inferred.framework;
        }

        // 검색 쿼리 구성
        let searchTerms: string[] = [];
        
        // 키워드 배열 우선 사용
        if (keywords.length > 0) {
          searchTerms.push(...keywords);
        }
        
        // feature와 framework 추가
        if (feature) searchTerms.push(feature);
        if (framework) searchTerms.push(framework);
        
        // 기본 검색어가 없으면 전체 검색
        if (searchTerms.length === 0) {
          searchTerms.push("auth", "authentication");
        }

        const finalQuery = searchTerms.join(' ');

        // 관련 문서 검색
        const searchResults = repository.searchDocumentsAdvanced({
          query: finalQuery,
          limit: 5,
          searchMode: SearchMode.BALANCED,
          useWeights: true,
          useSynonyms: true,
        });

        if (searchResults.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: "요청하신 조건에 맞는 문서를 찾을 수 없습니다. 다른 키워드로 시도해보세요." 
            }],
          };
        }

        // 응답 구성
        let responseText = `# BaaS 구현 가이드\n\n`;
        
        // 프로젝트 ID 정보
        if (projectId) {
          responseText += `> 📌 **Project ID**: \`${projectId}\`\n`;
          responseText += `> 🌐 **API Base URL**: \`https://api.aiapp.link\`\n`;
          responseText += `> 🍪 **Cookie Domain**: \`.aiapp.link\`\n\n`;
        } else {
          responseText += `> ⚠️ **Project ID 미설정**: 코드에서 [PROJECT_ID]를 실제 값으로 교체하세요.\n\n`;
        }

        responseText += `## 검색 조건\n\n`;
        if (feature) responseText += `- **기능**: ${feature}\n`;
        if (framework) responseText += `- **프레임워크**: ${framework}\n`;
        if (keywords.length > 0) responseText += `- **키워드**: ${keywords.join(', ')}\n`;
        responseText += `\n---\n\n`;

        // 문서 내용 추가
        searchResults.forEach((result, index) => {
          const document = result.document;
          responseText += `## 📄 ${document.getTitle()}\n\n`;
          responseText += `**카테고리**: ${document.getCategory()}\n`;
          responseText += `**설명**: ${document.getDescription()}\n\n`;
          responseText += document.getContent() + "\n\n";
          responseText += `---\n\n`;
        });

        return {
          content: [{ type: "text", text: responseText }],
        };

      } catch (error) {
        console.error('Implementation guide error:', error);
        return {
          content: [{ 
            type: "text", 
            text: `구현 가이드 검색 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
          }],
          isError: true,
        };
      }
    }
  };
}

export function createGetImplementationGuideTool(repository: BaaSDocsRepository, projectId?: string | null) {
  return createImplementationGuideTool(repository, projectId);
}