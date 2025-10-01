#!/usr/bin/env node

import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {createBaaSDocsRepository} from "./repository/createBaaSDocsRepository.js";
import {createGetDocumentByIdTool, createSearchDocumentsTool} from "./tools/document-search.tools.js";
import {GetDocumentByIdSchema, SearchDocumentsSchema} from "./schema/tool-schemas.js";

// Project ID 파싱
function parseProjectId(): string | null {
  // 명령줄 인자 파싱
  const args = process.argv.slice(2);
  let projectId: string | null = null;

  // --project-id=value 형식 확인
  const projectIdArg = args.find(arg => arg.startsWith('--project-id='));
  if (projectIdArg) {
    projectId = projectIdArg.split('=')[1];
  } else {
    // --project-id value 형식 확인 (띄어쓰기)
    const projectIdIndex = args.findIndex(arg => arg === '--project-id');
    if (projectIdIndex !== -1 && args[projectIdIndex + 1]) {
      projectId = args[projectIdIndex + 1];
    }
  }

  // 환경 변수 확인 (우선순위: 명령줄 인자 > 환경변수)
  projectId = projectId || process.env.BAAS_PROJECT_ID || null;

  return projectId;
}

async function main() {
  const server = new McpServer({
    name: "baas-mcp",
    description: "AIApp BaaS Authentication System MCP Server - AIApp 인증 시스템 API 문서 검색 및 코드 생성 지원",
    version: "2.0.0"
  });

  // Project ID 설정
  const projectId = parseProjectId();

  // Initialize document repository
  const docsRepository = await createBaaSDocsRepository();

  // Create tools
  const searchDocumentsTool = createSearchDocumentsTool(docsRepository, projectId);
  const getDocumentByIdTool = createGetDocumentByIdTool(docsRepository, projectId);

  // Register tools
  server.tool(
    "search-documents",
    `BaaS 인증 시스템의 기능별 구현 가이드를 키워드로 검색합니다.

⚠️ **중요**: 이 도구를 사용하기 전에 먼저 \`get-project-config\`를 실행하여 필수 구현 규칙을 확인하세요.

🔍 **검색 범위**: 기능별 구현 가이드만 검색 대상 (공통 규칙 문서는 get-project-config에서 제공)

🎯 **검색 가능한 구현 가이드**:
- 로그인 구현: keywords=['로그인', 'React'] - API + React + JavaScript 완전 구현
- 회원가입 구현: keywords=['회원가입', 'signup'] - API + 클라이언트 + 유효성 검사
- 사용자 정보: keywords=['사용자', '정보'] - API + 상태 관리 + 에러 처리
- 로그아웃 구현: keywords=['로그아웃', 'logout'] - API + 세션 정리 + 보안

💡 **사용법**:
- 키워드 배열: keywords=['JWT', '토큰'], keywords=['validation', 'form']
- 문장 검색: query="React 로그인 구현"

📌 **구현 시 필수 적용 사항** (get-project-config에서 확인):
- credentials: 'include' 설정
- result: "SUCCESS"/"FAIL" 응답 형식
- 조건부 렌더링 사용 (CSS display 속성 금지)
- HttpOnly 쿠키 자동 관리`,
    SearchDocumentsSchema,
    searchDocumentsTool.handler
  );

  server.tool(
    "get-document-by-id",
    `문서 ID로 특정 BaaS 인증 시스템 문서의 전체 내용을 조회합니다.

⚠️ **중요**: 이 문서만으로 구현하지 말고, \`get-project-config\`에서 제공하는 필수 구현 규칙을 함께 적용해야 합니다.

📌 **필수 참조 사항**:
- 보안 설정: credentials, HttpOnly 쿠키
- 에러 처리: ServiceException 표준 형식
- 상태 관리: 조건부 렌더링 패턴`,
    GetDocumentByIdSchema,
    getDocumentByIdTool.handler
  );



  // Project configuration and common docs initialization tool
  server.tool(
    "get-project-config",
    `BaaS MCP 초기 설정을 확인합니다.

**중요**: 모든 기능 구현 전에 먼저 이 도구를 실행하여 다음을 확인하세요:
1. 프로젝트 ID 설정 확인
2. 필수 구현 규칙 로드 (보안, 에러 처리, 상태 관리)

이 도구가 제공하는 필수 규칙은 모든 API 구현에 반드시 적용되어야 합니다.`,
    {
      type: "object" as const,
      properties: {}
    },
    async () => {
      // Common 문서 로드
      const commonDocs = docsRepository.getCommonDocs();

      // 프로젝트 설정 메시지
      let setupMessage = projectId
        ? `✅ **프로젝트 설정 완료**\n\nProject ID: ${projectId}\nAPI Endpoint: https://api.aiapp.link\nCookie Domain: .aiapp.link\n\n이 ID가 모든 예제 코드에 자동으로 적용됩니다.`
        : `⚠️ **Project ID가 설정되지 않았습니다**\n\nClaude Desktop 설정 예시:\n\`\`\`json\n{\n  "mcpServers": {\n    "baas-mcp": {\n      "command": "npx",\n      "args": ["-y", "@mbaas/baas-mcp@latest", "--project-id=your-actual-project-id"]\n    }\n  }\n}\n\`\`\`\n\n환경 변수 사용:\n\`\`\`json\n{\n  "mcpServers": {\n    "baas-mcp": {\n      "command": "npx",\n      "args": ["-y", "@mbaas/baas-mcp@latest"],\n      "env": {\n        "BAAS_PROJECT_ID": "your-actual-project-id"\n      }\n    }\n  }\n}\n\`\`\``;

      // Common 문서 내용 구성
      let commonDocsContent = '\n\n---\n\n# 📚 필수 구현 규칙\n\n**중요**: 아래 규칙들은 모든 BaaS API 구현 시 반드시 적용되어야 합니다.\n\n';

      if (commonDocs.length > 0) {
        commonDocs.forEach((doc, index) => {
          const title = doc.getTitle();
          const content = doc.getContent();

          commonDocsContent += `\n## ${index + 1}. ${title}\n\n`;
          commonDocsContent += content + '\n\n';
          commonDocsContent += '---\n';
        });
      } else {
        commonDocsContent += '⚠️ Common 문서를 로드할 수 없습니다.\n';
      }

      // 사용 안내 추가
      const usageGuide = `\n\n## 🚀 다음 단계\n\n1. **기능 검색**: \`search-documents\` 도구로 구현할 기능 검색\n   - 예: search-documents({keywords: ['로그인', 'React']})\n   - 예: search-documents({keywords: ['회원가입', 'validation']})\n\n2. **구현**: 위의 필수 규칙을 반드시 적용하여 코드 생성\n   ✅ credentials: 'include' 설정\n   ✅ result: "SUCCESS"/"FAIL" 응답 형식\n   ✅ 조건부 렌더링 사용 (display: none 금지)\n   ✅ HttpOnly 쿠키 자동 관리\n\n3. **검증**: 생성된 코드가 필수 규칙을 준수하는지 확인`;

      return {
        content: [{
          type: "text" as const,
          text: setupMessage + commonDocsContent + usageGuide
        }]
      };
    }
  );

  // 서버 시작
  const transport = new StdioServerTransport();
  await server.connect(transport);

}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});