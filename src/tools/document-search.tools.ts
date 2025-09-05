import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { BaaSDocsRepository } from "../repository/baas-docs.repository.js";
import { Category, categories } from "../document/types.js";

export function createSearchDocumentsTool(repository: BaaSDocsRepository, projectId?: string | null) {
  return {
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "검색할 키워드나 질문. 예: 'React 로그인 컴포넌트', 'JWT 토큰 설정', '쿠키 설정 방법'"
        },
        category: {
          type: "string",
          enum: categories,
          description: "검색할 문서 카테고리 (선택사항). api, templates, security, examples, dev, frameworks, errors, config 중 선택"
        },
        limit: {
          type: "number",
          description: "반환할 검색 결과 수 (기본값: 5, 최대: 10)",
          minimum: 1,
          maximum: 10
        }
      },
      required: ["query"]
    },
    handler: async (args: any): Promise<CallToolResult> => {
      try {
        const { query, category, limit = 5 } = args;
        
        const results = repository.searchDocuments(
          query,
          Math.min(limit, 10),
          category
        );

        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `검색어 "${query}"에 대한 문서를 찾을 수 없습니다. 다른 키워드로 검색해보세요.\n\n사용 가능한 검색 키워드 예시:\n- API 관련: login, signup, authentication, jwt, token\n- 프레임워크: react, vue, nextjs, javascript\n- 보안: security, cors, cookie, validation\n- 에러: error, troubleshooting, debugging`
              }
            ]
          };
        }

        let responseText = `"${query}" 검색 결과 (${results.length}개 문서):\n\n`;

        results.forEach((result, index) => {
          const doc = result.document;
          responseText += `## ${index + 1}. ${doc.getTitle()}\n`;
          responseText += `**카테고리**: ${doc.getCategory()}\n`;
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

        responseText += `💡 **Tip**: 더 자세한 내용은 \`get-document-by-id\` 도구로 문서 ID를 사용하여 전체 문서를 조회하세요.`;

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
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "number",
          description: "조회할 문서의 ID (search-documents 결과에서 확인 가능)"
        },
        includeMetadata: {
          type: "boolean",
          description: "문서 메타데이터 포함 여부 (기본값: false)",
          default: false
        }
      },
      required: ["id"]
    },
    handler: async (args: any): Promise<CallToolResult> => {
      try {
        const { id, includeMetadata = false } = args;
        
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
          responseText += `- 카테고리: ${document.getCategory()}\n`;
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

export function createGetDocumentsByCategory(repository: BaaSDocsRepository) {
  return {
    inputSchema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          enum: categories,
          description: "조회할 문서 카테고리. api, templates, security, examples, dev, frameworks, errors, config 중 선택"
        },
        limit: {
          type: "number",
          description: "반환할 문서 수 (기본값: 10)",
          minimum: 1,
          maximum: 20
        }
      },
      required: ["category"]
    },
    handler: async (args: any): Promise<CallToolResult> => {
      try {
        const { category, limit = 10 } = args;
        
        const documents = repository.getDocumentsByCategory(category as Category);
        const limitedDocs = documents.slice(0, limit);

        if (limitedDocs.length === 0) {
          const availableCategories = repository.getAllCategories();
          return {
            content: [
              {
                type: "text",
                text: `"${category}" 카테고리에 해당하는 문서가 없습니다.\n\n사용 가능한 카테고리:\n${availableCategories.map(cat => `- ${cat}`).join('\n')}`
              }
            ]
          };
        }

        let responseText = `# ${category.toUpperCase()} 카테고리 문서 목록\n\n`;
        responseText += `총 ${documents.length}개 문서 중 ${limitedDocs.length}개 표시\n\n`;

        limitedDocs.forEach((doc, index) => {
          responseText += `## ${index + 1}. ${doc.getTitle()}\n`;
          responseText += `**ID**: ${doc.getId()}\n`;
          responseText += `**URL**: ${doc.getUrl()}\n`;
          responseText += `**설명**: ${doc.getDescription()}\n\n`;
          responseText += `---\n\n`;
        });

        if (documents.length > limit) {
          responseText += `💡 **알림**: ${documents.length - limit}개의 추가 문서가 있습니다. limit 값을 늘려서 더 많은 문서를 조회할 수 있습니다.`;
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
              text: `카테고리 문서 조회 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  };
}