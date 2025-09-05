# BaaS MCP - 상세 사용 가이드

> **AI 기반 코드 자동 생성으로 더 빠른 인증 시스템 구현**

BaaS MCP는 이미 구축된 AIApp BaaS 인증 서비스(`https://api.aiapp.link`)와 연동하는 클라이언트 코드를 자동 생성하는 MCP(Model Context Protocol) 서버입니다. 
백엔드 구현이 아닌 **클라이언트 통합 코드**를 Claude, Cursor 등의 AI 어시스턴트를 통해 프레임워크별로 자동 생성합니다.

## ✨ 주요 기능

- 🔍 **API 규격 조회**: 운영 중인 AIApp BaaS API 명세 제공
- 🎨 **클라이언트 코드 생성**: React, Next.js, Vue, 순수 JavaScript 프레임워크별 인증 연동 코드 생성  
- 🍪 **쿠키 설정 가이드**: 서브도메인 간 쿠키 공유 설정 및 CORS 구성
- ⚡ **즉시 연동 가능**: 복사-붙여넣기로 바로 동작하는 클라이언트 코드 제공
- 📱 **반응형 지원**: 모바일 친화적인 UI 컴포넌트 생성
- 🏢 **멀티테넌트**: 프로젝트 ID별 독립적인 사용자 관리 지원

## 🚀 설치 및 설정

### 1. NPM 설치

```bash
# NPM으로 전역 설치
npm install -g @mbaas/baas-mcp@latest

# 또는 직접 실행
npx @mbaas/baas-mcp@latest
```

### 2. Claude Desktop 설정

Claude Desktop의 설정 파일에 추가하세요:

#### 기본 설정 (Project ID 수동 입력)
```json
{
  "mcpServers": {
    "baas-mcp": {
      "command": "npx",
      "args": ["-y", "@mbaas/baas-mcp@latest"]
    }
  }
}
```

#### 자동 설정 (Project ID 자동 적용) - 권장
```json
{
  "mcpServers": {
    "baas-mcp": {
      "command": "npx",
      "args": [
        "-y", 
        "@mbaas/baas-mcp@latest", 
        "--project-id=your-actual-project-id"
      ]
    }
  }
}
```

#### 환경 변수 사용
```json
{
  "mcpServers": {
    "baas-mcp": {
      "command": "npx",
      "args": ["-y", "@mbaas/baas-mcp@latest"],
      "env": {
        "BAAS_PROJECT_ID": "your-actual-project-id"
      }
    }
  }
}
```

## 🔧 Project ID 자동화

Project ID를 MCP 서버 설정에 포함하면 모든 생성되는 코드에 자동으로 적용됩니다.

### ✅ 자동 설정된 경우
```javascript
// MCP가 자동 생성하는 코드
const signupData = {
  user_id: "johndoe",
  user_pw: "password123",
  project_id: "your-actual-project-id", // 자동으로 주입됨
  data: {}
};
```

### ⚠️ 수동 설정이 필요한 경우
```javascript
// MCP가 생성하는 코드 (수동 교체 필요)
const signupData = {
  user_id: "johndoe", 
  user_pw: "password123",
  project_id: "[PROJECT_ID]", // 실제 값으로 교체 필요
  data: {}
};
```

### 여러 프로젝트 관리
개발자가 여러 프로젝트를 관리하는 경우:

```json
{
  "mcpServers": {
    "baas-dev": {
      "command": "npx",
      "args": ["-y", "@mbaas/baas-mcp@latest", "--project-id=dev-project-uuid"]
    },
    "baas-prod": {
      "command": "npx", 
      "args": ["-y", "@mbaas/baas-mcp@latest", "--project-id=prod-project-uuid"]
    }
  }
}
```

## 🛠 지원하는 도구 (Tools)

### `search-documents`
AIApp BaaS 인증 시스템 문서를 키워드로 검색합니다.

```typescript
// 사용 예시
{
  "query": "React 로그인 컴포넌트",    // 검색할 키워드
  "category": "templates",          // 카테고리 필터 (선택사항)
  "limit": 5                       // 결과 수 (기본값: 5)
}
```

### `get-document-by-id`  
특정 문서의 전체 내용을 조회합니다.

```typescript
// 사용 예시
{
  "id": 1,                        // 문서 ID
  "includeMetadata": false        // 메타데이터 포함 여부
}
```

### `get-documents-by-category`
카테고리별로 문서 목록을 조회합니다.

```typescript
// 사용 예시  
{
  "category": "api"               // "api" | "templates" | "security" | "examples"
}
```

### `get-project-config`
현재 MCP 서버에 설정된 프로젝트 ID를 확인합니다.

```typescript
// 사용 예시
{} // 매개변수 없음
```

**반환 예시 (Project ID 설정됨)**:
```
✅ Project ID가 설정되었습니다: your-project-id

이 ID가 모든 예제 코드에 자동으로 적용됩니다.

API Endpoint: https://api.aiapp.link
Cookie Domain: .aiapp.link
```

**반환 예시 (Project ID 미설정)**:
```
⚠️ Project ID가 설정되지 않았습니다.
아래 코드의 [PROJECT_ID]를 실제 값으로 교체해야 합니다.
```

## 📋 API 규격

### 회원가입 API
```http
POST /signup
Content-Type: application/json

{
  "user_id": "johndoe",
  "user_pw": "password123",
  "name": "John Doe", 
  "phone": "010-1234-5678",
  "is_reserved": false,
  "project_id": "uuid-here",     // 필수
  "data": {                      // 커스텀 필드
    "age": 25,
    "interests": ["coding"]
  }
}
```

### 로그인 API
```http
POST /login  
Content-Type: application/json

{
  "user_id": "johndoe",
  "user_pw": "password123",
  "project_id": "uuid-here"      // 필수
}
```

**응답**: JWT 토큰과 함께 자동으로 쿠키 설정
```http
Set-Cookie: access_token=eyJ...; HttpOnly; Secure; Domain=.aiapp.link; SameSite=None
```

### 사용자 정보 API
```http
GET /info
Authorization: Bearer {access_token}
```

## 🎯 생성 가능한 컴포넌트

| 프레임워크 | 컴포넌트 | 설명 |
|-----------|---------|------|
| **React** | `login` | 로그인 폼 컴포넌트 |
|           | `signup` | 회원가입 폼 컴포넌트 |  
|           | `auth-hook` | useAuth 커스텀 훅 + Context |
| **Next.js** | `middleware` | 인증 미들웨어 |
|             | `api-route` | 프록시 API 라우트 |
|             | `auth-context` | 서버 컴포넌트 인증 |
| **Vue** | `login` | 로그인 Vue 컴포넌트 |
|         | `auth-composable` | useAuth 컴포저블 |
| **Vanilla JS** | `login-form` | 순수 HTML/JS 로그인 폼 |
|               | `signup-form` | 순수 HTML/JS 회원가입 폼 |
|               | `auth-manager` | 인증 상태 관리 클래스 |
|               | `jquery-example` | jQuery 연동 예제 |

## 📱 스타일링 옵션

- **Tailwind CSS**: `"styling": "tailwind"`
- **CSS Modules**: `"styling": "css"`  
- **스타일 없음**: `"styling": "none"`

## 🍪 쿠키 설정

### 프로덕션 환경
```javascript
{
  httpOnly: true,      // XSS 방지
  secure: true,        // HTTPS 전용
  domain: ".aiapp.link", // 서브도메인 공유
  sameSite: "none",    // 크로스 도메인 허용
  maxAge: 86400        // 24시간
}
```

### 개발 환경
```javascript
{
  httpOnly: true,
  secure: false,       // HTTP 허용
  domain: "localhost",
  sameSite: "lax",
  maxAge: 86400
}
```

## 🤝 사용 예시

### React 로그인 폼 생성

**요청**:
```
"React에서 프로젝트 ID 포함한 로그인 폼 만들어줘. Tailwind CSS로 스타일링하고 에러 처리도 추가해줘"
```

**생성되는 코드**:
```tsx
import { useState } from 'react';
import axios from 'axios';

interface LoginForm {
  user_id: string;
  user_pw: string;
  project_id?: string;
}

export const LoginComponent = ({ onSuccess, onError, className }: LoginProps) => {
  const [form, setForm] = useState<LoginForm>({
    user_id: '',
    user_pw: '',
    project_id: undefined
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        'https://api.aiapp.link/login',
        form,
        { withCredentials: true }
      );

      if (response.data.success) {
        onSuccess?.(response.data.data);
      }
    } catch (err: any) {
      const errorMessage = err.response?.status === 422 
        ? '입력값을 확인해주세요.' 
        : err.response?.status === 401 
        ? '아이디 또는 비밀번호가 올바르지 않습니다.'
        : '로그인에 실패했습니다.';
      
      setError(errorMessage);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="아이디"
          value={form.user_id}
          onChange={(e) => setForm({...form, user_id: e.target.value})}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      <div className="mb-4">
        <input
          type="password"
          placeholder="비밀번호"
          value={form.user_pw}
          onChange={(e) => setForm({...form, user_pw: e.target.value})}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="프로젝트 ID"
          value={form.project_id || '550e8400-e29b-41d4-a716-446655440000'}
          onChange={(e) => setForm({...form, project_id: e.target.value})}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
};
```

## 📞 지원

- 📧 Email: support@aiapp.link
- 📚 문서: https://docs.aiapp.link
- 🐛 버그 리포트: https://github.com/aiapp/baas-mcp/issues

---

**Built with ❤️ by AIApp Team**