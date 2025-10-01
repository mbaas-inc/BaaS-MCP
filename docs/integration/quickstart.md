# 빠른 시작 가이드

AIApp BaaS MCP 서버를 사용하여 5분 안에 인증 시스템을 구축하는 방법입니다.

## 시작 전 준비사항

### 1. 프로젝트 ID 확인

AIApp BaaS 멀티테넌트 시스템에서는 각 프로젝트마다 고유한 ID가 필요합니다.

```
프로젝트 ID 예시: [PROJECT_ID]
도메인: https://myproject.aiapp.link
```

> **프로젝트 ID를 모르시나요?**
> AIApp 관리자에게 문의하거나 기존 프로젝트 설정에서 확인할 수 있습니다.

### 2. MCP 서버 설치

Claude Desktop 설정 파일(`~/Library/Application Support/Claude/claude_desktop_config.json`)에 추가:

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

## 🚀 5분 빠른 시작

### 1단계: 로그인 폼 생성

Claude에게 다음과 같이 요청하세요:

```
"React 로그인 폼을 만들어줘. 프로젝트 ID는 [PROJECT_ID]이야."
```

MCP 서버가 자동으로:
- ✅ API 연동 코드 생성
- ✅ 에러 처리 로직 포함
- ✅ TypeScript 타입 정의
- ✅ 쿠키 설정 자동 처리

### 2단계: 회원가입 폼 추가

```
"이제 회원가입 폼도 만들어줘. 커스텀 필드로 나이(age)랑 부서(department)도 추가해줘."
```

### 3단계: 인증 상태 관리

```
"로그인 상태를 관리할 수 있는 useAuth 훅도 만들어줘."
```

## 📋 주요 설정값

모든 템플릿에서 공통으로 사용되는 설정값들입니다:

```javascript
const CONFIG = {
  API_ENDPOINT: 'https://api.aiapp.link',
  PROJECT_ID: '[PROJECT_ID]', // 실제 프로젝트 ID로 변경
  COOKIE_DOMAIN: '.aiapp.link',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: true, // HTTPS 환경에서는 필수
    sameSite: 'none' // 크로스 도메인 허용
  }
};
```

## 🎯 프레임워크별 예제

### React

```
"React + TypeScript + Tailwind CSS로 완전한 인증 시스템 만들어줘. 
프로젝트 ID: [your-project-id]"
```

생성되는 파일:
- `LoginForm.tsx` - 로그인 컴포넌트
- `SignupForm.tsx` - 회원가입 컴포넌트  
- `useAuth.tsx` - 인증 훅
- `AuthContext.tsx` - 인증 컨텍스트

### Vue 3

```
"Vue 3 Composition API로 인증 시스템 만들어줘.
프로젝트 ID: [your-project-id]"
```

생성되는 파일:
- `LoginComponent.vue` - 로그인 컴포넌트
- `SignupComponent.vue` - 회원가입 컴포넌트
- `useAuth.ts` - 인증 컴포저블

### 순수 JavaScript

```
"순수 JavaScript와 HTML로 로그인 폼 만들어줘.
프로젝트 ID: [your-project-id]"
```

생성되는 파일:
- `login.html` - 로그인 페이지
- `signup.html` - 회원가입 페이지
- `auth-manager.js` - 인증 관리 스크립트

## ⚡ 즉시 사용 가능한 기능들

모든 생성된 코드에는 다음 기능이 자동으로 포함됩니다:

### 🔐 인증 기능
- [x] 로그인/로그아웃
- [x] 회원가입
- [x] 자동 로그인 상태 확인
- [x] JWT 토큰 자동 관리

### 🛡️ 보안 기능  
- [x] HTTPS 쿠키 자동 설정
- [x] CSRF 보호 준비
- [x] 입력값 유효성 검사
- [x] 에러 처리 및 메시지

### 📱 사용자 경험
- [x] 로딩 상태 표시
- [x] 에러 메시지 표시
- [x] 반응형 디자인
- [x] 접근성 지원

### 🎨 커스터마이징
- [x] Tailwind CSS 스타일링
- [x] 커스텀 필드 지원
- [x] 다양한 스타일 옵션
- [x] 테마 변경 가능

## 🔧 일반적인 설정

### 환경별 API 엔드포인트

```javascript
const API_ENDPOINTS = {
  production: 'https://api.aiapp.link',
  development: 'https://dev-api.aiapp.link', // 개발 서버가 있다면
  local: 'http://localhost:8000' // 로컬 테스트용
};

const API_ENDPOINT = API_ENDPOINTS[process.env.NODE_ENV] || API_ENDPOINTS.production;
```

### CORS 설정 확인

프론트엔드에서 API 요청 시 다음 설정이 필요합니다:

```javascript
// Fetch API
fetch(API_ENDPOINT + '/account/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // 쿠키 포함
  body: JSON.stringify(loginData)
});

// Axios
axios.defaults.withCredentials = true;
axios.post(API_ENDPOINT + '/account/login', loginData);
```

### 에러 처리

API에서 반환하는 표준 에러 형식:

```json
{
  "result": "FAIL",
  "errorCode": "INVALID_CREDENTIALS",
  "message": "사용자에게 표시할 메시지",
  "detail": [] // 상세 에러 정보 (422 에러 시)
}
```

## 🚨 문제 해결

### 쿠키가 설정되지 않을 때

**증상**: 로그인 성공 후에도 인증 상태가 유지되지 않음

**해결책**:
1. `credentials: 'include'` 또는 `withCredentials: true` 설정 확인
2. HTTPS 환경에서는 `secure: true` 필요
3. 크로스 도메인에서는 `sameSite: 'none'` 필요

### CORS 에러 발생 시

**증상**: 브라우저에서 CORS 정책 에러 발생

**해결책**:
백엔드에서 이미 CORS 설정이 되어 있으므로, 클라이언트에서 올바른 도메인으로 요청하는지 확인:
- 프로덕션: `https://api.aiapp.link`
- 올바른 `Content-Type` 헤더 포함
- `credentials: 'include'` 설정

### 401 인증 에러 처리

**증상**: API 요청 시 401 Unauthorized 에러

**자동 처리 예제**:
```javascript
// Axios 인터셉터
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 로그인 페이지로 이동
      window.location.href = '/account/login';
    }
    return Promise.reject(error);
  }
);
```

## 📞 추가 도움

- 📚 [API 규격 문서](../api/)
- 🎨 [템플릿 예제](../templates/)
- 🔗 [인증 플로우 가이드](./authentication-flow.md)

---

**💡 팁**: MCP 서버는 여러분의 요구사항에 맞게 코드를 자동으로 생성합니다. 구체적으로 요청할수록 더 정확한 코드를 받을 수 있어요!