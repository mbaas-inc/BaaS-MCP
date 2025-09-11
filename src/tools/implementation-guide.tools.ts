import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { BaaSDocsRepository } from "../repository/baas-docs.repository.js";
import { SearchMode } from "../constants/search-mode.js";

export interface ImplementationGuideOptions {
  feature?: 'login' | 'signup' | 'info' | 'logout';
  framework?: 'react' | 'vue' | 'nextjs' | 'vanilla';
  keywords?: string;
}

export function createImplementationGuideTool(repository: BaaSDocsRepository, projectId?: string | null) {
  return {
    inputSchema: {
      type: "object" as const,
      properties: {
        feature: {
          type: "string",
          enum: ["login", "signup", "info", "logout"],
          description: "구현할 BaaS 기능. login(로그인), signup(회원가입), info(내정보), logout(로그아웃)"
        },
        framework: {
          type: "string", 
          enum: ["react", "vue", "nextjs", "vanilla"],
          description: "사용할 프레임워크. react, vue, nextjs, vanilla 중 선택"
        },
        keywords: {
          type: "string",
          description: "추가 검색 키워드 (선택사항)"
        }
      },
      required: []
    },
    handler: async (args: any): Promise<CallToolResult> => {
      try {
        const { feature, framework, keywords } = args;

        // 검색 쿼리 구성
        let searchQueries: string[] = [];
        
        if (feature && framework) {
          searchQueries.push(`${feature} ${framework}`);
        } else if (feature) {
          searchQueries.push(feature);
        } else if (framework) {
          searchQueries.push(framework);
        }
        
        if (keywords) {
          searchQueries.push(keywords);
        }
        
        // 기본 검색어가 없으면 전체 검색
        if (searchQueries.length === 0) {
          searchQueries.push("auth authentication");
        }

        const finalQuery = searchQueries.join(' ');

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
        if (keywords) responseText += `- **추가 키워드**: ${keywords}\n`;
        responseText += `\n---\n\n`;

        // 문서 내용 추가
        searchResults.forEach((result, index) => {
          const document = repository.findOneById(result.id);
          if (document) {
            responseText += `## 📄 ${document.getTitle()}\n\n`;
            responseText += `**카테고리**: ${document.getCategory()}\n`;
            responseText += `**설명**: ${document.getDescription()}\n\n`;
            responseText += document.getContent() + "\n\n";
            responseText += `---\n\n`;
          }
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