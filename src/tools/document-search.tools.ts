import {CallToolResult} from "@modelcontextprotocol/sdk/types.js";
import {BaaSDocsRepository} from "../repository/baas-docs.repository.js";
import {SearchMode} from "../constants/search-mode.js";
import {GetDocumentByIdParams, SearchDocumentsParams} from "../schema/tool-schemas.js";

export function createSearchDocumentsTool(repository: BaaSDocsRepository, projectId?: string | null) {
  return {
    handler: async (params: SearchDocumentsParams): Promise<CallToolResult> => {
      try {
        const { keywords, query, searchMode = SearchMode.BALANCED, limit = 5 } = params;
        
        let finalSearchQuery = '';
        let finalKeywords: string[] = [];
        
        // keywords 배열이 있으면 우선 사용
        if (keywords && keywords.length > 0) {
          finalKeywords = keywords.filter(k => k.trim().length > 0);
          finalSearchQuery = finalKeywords.join(' ');
        } 
        // 폴백: query 문자열 사용
        else if (query && query.trim().length > 0) {
          finalSearchQuery = query.trim();
          // query를 간단히 키워드로 분할
          finalKeywords = query.toLowerCase()
            .replace(/[^\w\s가-힣]/g, ' ')
            .split(/\s+/)
            .filter(term => term.length > 1);
        } 
        // 둘 다 없으면 에러
        else {
          return {
            content: [
              {
                type: "text",
                text: `검색 키워드가 필요합니다. 다음과 같이 사용해주세요:\n\n키워드 배열 사용 (권장):\n- keywords: ['로그인', 'React']\n- keywords: ['JWT', '토큰']\n- keywords: ['쿠키', '설정']\n\n문장 사용 (폴백):\n- query: "React 로그인 컴포넌트"\n- query: "JWT 토큰 설정"\n\n사용 가능한 검색 키워드:\n- API 관련: login, signup, authentication, jwt, token\n- 프레임워크: react, nextjs, javascript\n- 보안: security, cors, cookie, validation\n- 에러: error, troubleshooting, debugging`
              }
            ]
          };
        }
        
        // 새로운 고급 검색 기능을 기본으로 사용
        const results = repository.searchDocumentsAdvanced({
          query: finalSearchQuery,
          limit: Math.min(limit, 10),
          searchMode: searchMode,
          useWeights: true,
          useSynonyms: true,
          minScore: 0.3, // 절대 최소 점수 임계값 설정
        });

        if (results.length === 0) {
          const searchTerm = finalKeywords.length > 0 ? finalKeywords.join(', ') : finalSearchQuery;
          return {
            content: [
              {
                type: "text",
                text: `검색어 "${searchTerm}"에 대한 관련 문서를 찾을 수 없습니다.\n\n**AIApp BaaS 인증 시스템 문서는 다음 주제로 제한됩니다:**\n\n📚 **사용 가능한 문서 주제:**\n• **로그인 구현**: React/JavaScript 완전 구현 가이드\n• **회원가입 구현**: React/JavaScript 완전 구현 가이드\n• **로그아웃 구현**: React/JavaScript 완전 구현 가이드\n• **사용자 정보**: React/JavaScript 완전 구현 가이드\n• **에러 처리**: 모든 ServiceException과 클라이언트 처리 패턴\n• **보안**: 쿠키, CORS, XSS 방지 설정\n• **통합 가이드**: 빠른 시작 및 인증 플로우\n\n🔍 **권장 검색 키워드:**\n• 로그인: ['로그인', 'React'], ['login', 'javascript']\n• 회원가입: ['회원가입', 'signup'], ['validation', 'form']\n• JWT 토큰: ['JWT', '토큰'], ['authentication', 'token']\n• 에러 처리: ['에러', 'error'], ['ServiceException', 'validation']\n• 보안 설정: ['쿠키', '보안'], ['cors', 'security']\n\n💡 **Tip**: 구체적인 기능과 구현 방식을 함께 검색하면 더 정확한 결과를 얻을 수 있습니다.`
              }
            ]
          };
        }

        const searchTerm = finalKeywords.length > 0 ? finalKeywords.join(', ') : finalSearchQuery;
        let responseText = `"${searchTerm}" 검색 결과 (${results.length}개 문서):\n\n`;

        results.forEach((result, index) => {
          const doc = result.document;
          responseText += `## ${index + 1}. ${doc.getTitle()}\n`;
          responseText += `**문서 ID**: ${doc.getId()}\n`;
          responseText += `**URL**: ${doc.getUrl()}\n`;
          responseText += `**설명**: ${doc.getDescription()}\n`;
          responseText += `**관련도 점수**: ${result.score.toFixed(2)}\n\n`;
          
          if (result.relevantChunks.length > 0) {
            responseText += `**관련 내용**:\n`;
            result.relevantChunks.forEach((chunk, chunkIndex) => {
              responseText += `${chunkIndex + 1}. ${chunk.substring(0, 200)}${chunk.length > 200 ? '...' : ''}\n\n`;
            });
          }
          
          responseText += `---\n\n`;
        });

        responseText += `💡 **Tip**: 더 자세한 내용은 \`get-document-by-id\` 도구에 위에 표시된 **문서 ID**를 사용하여 전체 문서를 조회하세요.\n예: get-document-by-id를 사용할 때 id 파라미터에 위 검색 결과의 문서 ID 값을 입력하세요.`;

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text", 
              text: `문서 검색 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  };
}

export function createGetDocumentByIdTool(repository: BaaSDocsRepository, projectId?: string | null) {
  return {
    handler: async (params: GetDocumentByIdParams): Promise<CallToolResult> => {
      try {
        const { id, includeMetadata = false } = params;
        
        const document = repository.getDocumentById(id);
        
        if (!document) {
          return {
            content: [
              {
                type: "text",
                text: `ID ${id}에 해당하는 문서를 찾을 수 없습니다. search-documents를 사용하여 먼저 문서를 검색해보세요.`
              }
            ]
          };
        }

        let responseText = `# ${document.getTitle()}\n\n`;
        
        if (includeMetadata) {
          responseText += `**문서 정보**:\n`;
          responseText += `- ID: ${document.getId()}\n`;
          responseText += `- URL: ${document.getUrl()}\n`;
          responseText += `- 설명: ${document.getDescription()}\n`;
          responseText += `- 키워드: ${Array.from(document.getKeywords()).slice(0, 10).join(', ')}\n\n`;
          responseText += `---\n\n`;
        }
        
        let contentText = document.getContent();

        // Project ID 플레이스홀더 교체
        if (projectId) {
          // [PROJECT_ID] 플레이스홀더를 실제 값으로 교체
          contentText = contentText.replace(/\[PROJECT_ID\]/g, projectId);
          
          // 문서 상단에 설정 정보 추가
          responseText += `> 📌 **현재 Project ID**: \`${projectId}\`\n> 아래 코드에서 [PROJECT_ID]가 자동으로 교체되었습니다.\n\n`;
        } else {
          // Project ID가 설정되지 않은 경우 안내
          responseText += `> ⚠️ **Project ID 미설정**: Claude Desktop 설정에서 --project-id를 추가하세요.\n> 아래 코드의 [PROJECT_ID]를 실제 값으로 교체해야 합니다.\n\n`;
        }

        responseText += contentText;

        // Suggest similar documents
        const similarDocs = repository.getSimilarDocuments(document, 3);
        if (similarDocs.length > 0) {
          responseText += `\n\n## 관련 문서\n\n`;
          similarDocs.forEach((similarDoc, index) => {
            responseText += `${index + 1}. **${similarDoc.getTitle()}** (ID: ${similarDoc.getId()})\n`;
            responseText += `   - ${similarDoc.getDescription()}\n`;
            responseText += `   - ${similarDoc.getUrl()}\n\n`;
          });
        }

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `문서 조회 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  };
}

