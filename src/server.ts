#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createBaaSDocsRepository } from "./repository/createBaaSDocsRepository.js";
import { 
  createSearchDocumentsTool,
  createGetDocumentByIdTool,
  createGetDocumentsByCategory 
} from "./tools/document-search.tools.js";
import { createGetImplementationGuideTool } from "./tools/implementation-guide.tools.js";

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
  const getDocumentsByCategoryTool = createGetDocumentsByCategory(docsRepository);
  const implementationGuideTool = createGetImplementationGuideTool(docsRepository, projectId);

  // Register tools
  server.tool(
    "search-documents",
    `AIApp BaaS 인증 시스템 문서를 키워드 배열로 검색합니다.

사용 예시:
- 로그인 React 컴포넌트: keywords=['로그인', 'React']
- JWT 토큰 설정: keywords=['JWT', '토큰']
- HTML 회원가입 폼: keywords=['회원가입', 'HTML']

키워드 배열 사용 (권장):
- keywords: ['로그인', 'React'], ['JWT', '토큰'], ['쿠키', '설정']

문장 사용 (폴백):
- query: "React 로그인 컴포넌트"`,
    searchDocumentsTool.inputSchema,
    searchDocumentsTool.handler
  );

  server.tool(
    "get-document-by-id",
    "문서 ID로 특정 BaaS 인증 시스템 문서의 전체 내용을 조회합니다.",
    getDocumentByIdTool.inputSchema,
    getDocumentByIdTool.handler
  );

  server.tool(
    "get-documents-by-category",
    "카테고리별로 BaaS 인증 시스템 문서를 조회합니다. API, 템플릿, 보안, 예제, 개발 가이드 등의 카테고리로 필터링할 수 있습니다.",
    getDocumentsByCategoryTool.inputSchema,
    getDocumentsByCategoryTool.handler
  );

  server.tool(
    "get-implementation-guide",
    `BaaS 인증 기능 구현 가이드를 키워드 배열로 검색합니다.

사용 예시:
- 로그인 HTML 페이지: keywords=['로그인', 'HTML']
- React 회원가입: keywords=['회원가입', 'React']
- Vue.js 인증: keywords=['인증', 'Vue']

파라미터:
- keywords (권장): 구현 키워드 배열
- feature (선택): login|signup|info|logout - keywords에서 자동 추출
- framework (선택): react|vue|nextjs|vanilla - keywords에서 자동 추출

키워드에서 자동 매핑:
- '로그인', 'login' → feature: 'login'
- '회원가입', 'signup' → feature: 'signup'
- 'HTML', 'javascript' → framework: 'vanilla'
- 'React', '리액트' → framework: 'react'`,
    implementationGuideTool.inputSchema,
    implementationGuideTool.handler
  );

  // Project configuration tool
  server.tool(
    "get-project-config",
    "현재 MCP 서버에 설정된 프로젝트 ID를 확인합니다.",
    {
      type: "object" as const,
      properties: {}
    },
    async () => ({
      content: [{
        type: "text" as const,
        text: projectId 
          ? `✅ Project ID가 설정되었습니다: ${projectId}\n\n이 ID가 모든 예제 코드에 자동으로 적용됩니다.\n\nAPI Endpoint: https://api.aiapp.link\nCookie Domain: .aiapp.link`
          : `⚠️ Project ID가 설정되지 않았습니다.\n\nClaude Desktop 설정 예시:\n\`\`\`json\n{\n  "mcpServers": {\n    "baas-mcp": {\n      "command": "npx",\n      "args": ["-y", "@mbaas/baas-mcp@latest", "--project-id=your-actual-project-id"]\n    }\n  }\n}\n\`\`\`\n\n환경 변수 사용:\n\`\`\`json\n{\n  "mcpServers": {\n    "baas-mcp": {\n      "command": "npx",\n      "args": ["-y", "@mbaas/baas-mcp@latest"],\n      "env": {\n        "BAAS_PROJECT_ID": "your-actual-project-id"\n      }\n    }\n  }\n}\n\`\`\``
      }]
    })
  );

  // 서버 시작
  const transport = new StdioServerTransport();
  await server.connect(transport);

}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});