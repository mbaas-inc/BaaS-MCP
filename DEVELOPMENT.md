# BaaS MCP - 개발자 가이드

BaaS MCP 프로젝트에 기여하거나 커스터마이징을 위한 개발자 가이드입니다.

## 🏗️ 프로젝트 구조

```
baas-mcp/
├── src/                          # 소스 코드
│   ├── server.ts                 # MCP 서버 메인 파일
│   ├── document/                 # 문서 관리
│   │   ├── baas-document.ts      # 문서 클래스
│   │   ├── baas-document.loader.ts
│   │   ├── markdown-document.fetcher.ts
│   │   ├── parseLLMText.ts
│   │   └── types.ts
│   ├── repository/               # 데이터 저장소
│   │   ├── baas-docs.repository.ts
│   │   └── createBaaSDocsRepository.ts
│   └── tools/                    # MCP 도구들
│       └── document-search.tools.ts
├── docs/                         # S3 호스팅용 문서
│   ├── api/                      # API 명세서
│   ├── templates/                # 코드 템플릿
│   ├── integration/              # 통합 가이드
│   └── security/                 # 보안 가이드
├── dist/                         # 컴파일된 파일
├── README.md                     # 메인 README
├── GUIDE.md                      # 상세 사용 가이드
├── TROUBLESHOOTING.md           # 문제 해결 가이드
├── DEVELOPMENT.md               # 이 파일
└── package.json                 # 패키지 설정
```

## 🚀 로컬 개발 환경 설정

### 1. 저장소 클론

```bash
git clone https://github.com/aiapp/baas-mcp.git
cd baas-mcp
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 모드 실행

```bash
# TypeScript 개발 모드 (tsx 사용)
npm run dev

# 또는 빌드 후 실행
npm run build
npm start
```

### 4. 타입 체크

```bash
# 타입 체크만 수행 (컴파일하지 않음)
npm run typecheck
```

### 5. 클린 빌드

```bash
# dist 폴더 삭제 후 빌드
npm run clean && npm run build
```

## 🔧 MCP 서버 아키텍처

### 서버 구조 (`src/server.ts`)

```typescript
// MCP 서버 초기화
const server = new Server({
  name: "aiapp-baas-mcp",
  version: "2.0.3"
});

// 도구 등록
server.tool("search-documents", searchDocuments);
server.tool("get-document-by-id", getDocumentById);
server.tool("get-documents-by-category", getDocumentsByCategory);
server.tool("get-project-config", getProjectConfig);
```

### 도구 구현 (`src/tools/document-search.tools.ts`)

```typescript
export function createSearchDocumentsTool(
  repository: BaaSDocsRepository, 
  projectId?: string | null
) {
  return {
    handler: async (args: any): Promise<CallToolResult> => {
      // 도구 로직 구현
      const results = await repository.searchDocuments(args.query);
      
      // Project ID 플레이스홀더 교체
      if (projectId) {
        contentText = contentText.replace(/\[PROJECT_ID\]/g, projectId);
      }
      
      return { content: [{ type: "text", text: responseText }] };
    }
  };
}
```

### 문서 저장소 (`src/repository/baas-docs.repository.ts`)

BM25 알고리즘을 사용한 문서 검색:

```typescript
export class BaaSDocsRepository {
  searchDocuments(query: string, category?: string, limit: number = 5): BaaSDocument[] {
    // BM25 스코어링으로 관련도 계산
    const queryTerms = this.tokenize(query);
    const scores = this.documents.map(doc => ({
      document: doc,
      score: this.calculateBM25Score(doc, queryTerms)
    }));

    // 스코어 순으로 정렬 후 반환
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.document);
  }
}
```

## 📝 새로운 템플릿 추가

### 1. 문서 파일 생성

새 템플릿을 `docs/templates/{framework}/` 디렉토리에 추가:

```bash
# 예: Angular 템플릿 추가
mkdir -p docs/templates/angular
touch docs/templates/angular/login-component.md
```

### 2. 템플릿 문서 작성

```markdown
---
title: "Angular 로그인 컴포넌트"
category: "templates"
framework: "angular"
component_type: "login"
difficulty: "beginner"
tags: ["angular", "authentication", "component"]
---

# Angular 로그인 컴포넌트

Angular에서 AIApp BaaS 인증을 위한 로그인 컴포넌트입니다.

## 설치

\`\`\`bash
npm install @angular/common @angular/forms @angular/http
\`\`\`

## 구현

\`\`\`typescript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  template: \`
    <form (ngSubmit)="onSubmit()">
      <input [(ngModel)]="loginData.user_id" placeholder="사용자 ID" required>
      <input [(ngModel)]="loginData.user_pw" type="password" placeholder="비밀번호" required>
      <input [(ngModel)]="loginData.project_id" placeholder="프로젝트 ID" value="[PROJECT_ID]" required>
      <button type="submit">로그인</button>
    </form>
  \`
})
export class LoginComponent {
  loginData = {
    user_id: '',
    user_pw: '',
    project_id: '[PROJECT_ID]'
  };

  constructor(private http: HttpClient) {}

  onSubmit() {
    this.http.post('https://api.aiapp.link/login', this.loginData, { 
      withCredentials: true 
    }).subscribe(
      response => console.log('Login successful', response),
      error => console.error('Login failed', error)
    );
  }
}
\`\`\`

## 사용법

1. 컴포넌트를 모듈에 등록
2. [PROJECT_ID]를 실제 프로젝트 ID로 교체
3. 필요에 따라 스타일링 적용
```

### 3. S3에 업로드

```bash
# AWS CLI로 문서 업로드
aws s3 cp docs/ s3://bass-docs/ --recursive
```

### 4. llms.txt 업데이트

S3에 호스팅된 문서를 MCP 서버가 인식할 수 있도록 llms.txt를 업데이트:

```
# Angular 로그인 컴포넌트
https://docs.aiapp.link/templates/angular/login-component.md
```

## 🔍 새로운 API 엔드포인트 추가

### 1. API 문서 생성

`docs/api/` 디렉토리에 새 API 문서 추가:

```bash
touch docs/api/auth/reset-password.md
```

### 2. API 문서 작성

```markdown
---
title: "비밀번호 재설정 API"
category: "api"
endpoint: "/reset-password"
method: "POST"
---

# 비밀번호 재설정 API

사용자의 비밀번호를 재설정하는 API입니다.

## 엔드포인트

```http
POST /reset-password
Content-Type: application/json

{
  "user_id": "string",
  "project_id": "string",
  "new_password": "string",
  "reset_token": "string"
}
```

## 응답

성공시:
```json
{
  "success": true,
  "message": "비밀번호가 성공적으로 재설정되었습니다."
}
```
```

### 3. 도구에 반영

필요한 경우 `src/tools/document-search.tools.ts`에 새로운 도구를 추가할 수 있습니다.

## 🧪 테스트

### 단위 테스트 작성

```bash
# Jest 설치
npm install --save-dev jest @types/jest ts-jest

# 테스트 실행 스크립트 추가 (package.json)
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

### 테스트 파일 예시

```typescript
// src/__tests__/repository.test.ts
import { BaaSDocsRepository } from '../repository/baas-docs.repository';

describe('BaaSDocsRepository', () => {
  let repository: BaaSDocsRepository;

  beforeEach(() => {
    repository = new BaaSDocsRepository([]);
  });

  test('should search documents by keyword', () => {
    // 테스트 구현
  });

  test('should filter by category', () => {
    // 테스트 구현
  });
});
```

## 📦 배포

### 1. 버전 업데이트

```bash
# package.json의 version 필드 업데이트
npm version patch  # 2.0.3 -> 2.0.4
npm version minor  # 2.0.3 -> 2.1.0
npm version major  # 2.0.3 -> 3.0.0
```

### 2. 빌드 및 배포

```bash
# 빌드
npm run build

# npm에 배포
npm publish
```

### 3. S3 문서 업데이트

```bash
# 문서 업로드
aws s3 sync docs/ s3://bass-docs/ --delete
```

## 🔧 개발 도구 설정

### VSCode 설정

`.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

### ESLint 설정

```bash
npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

`.eslintrc.js`:
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn'
  }
};
```

## 🤝 기여 가이드

### 1. 이슈 생성

새로운 기능이나 버그 수정을 위해 GitHub 이슈를 먼저 생성하세요.

### 2. 브랜치 생성

```bash
git checkout -b feature/new-template-framework
git checkout -b fix/cookie-issue
git checkout -b docs/update-api-guide
```

### 3. 커밋 메시지 규칙

```
feat: Angular 템플릿 추가
fix: 쿠키 도메인 설정 수정  
docs: API 문서 업데이트
refactor: 코드 구조 개선
test: 단위 테스트 추가
```

### 4. Pull Request

- 변경사항에 대한 명확한 설명
- 관련 이슈 번호 참조
- 테스트 결과 포함
- 스크린샷 (UI 변경사항이 있는 경우)

## 📊 모니터링

### 로그 확인

```typescript
// 개발 시 디버깅용 로그
console.log('[DEBUG] Project ID:', projectId);
console.log('[DEBUG] Search query:', query);
console.log('[DEBUG] Search results:', results.length);
```

### 성능 측정

```typescript
// 검색 성능 측정
const startTime = Date.now();
const results = repository.searchDocuments(query);
const endTime = Date.now();
console.log(`Search took ${endTime - startTime}ms`);
```

## 📞 지원

개발 관련 문의:
- 📧 Email: dev@aiapp.link
- 💬 Discord: [개발자 채널]
- 🐛 Issues: https://github.com/aiapp/baas-mcp/issues

---

**Built with ❤️ by AIApp Team**