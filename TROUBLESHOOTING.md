# BaaS MCP - 문제 해결 가이드

BaaS MCP를 사용하면서 발생할 수 있는 일반적인 문제들과 해결 방법을 안내합니다.

## 🍪 쿠키 관련 문제

### 로그인 후 쿠키가 저장되지 않을 때

**증상**: 
- 로그인 API 호출이 성공하지만 브라우저에 쿠키가 저장되지 않음
- 새로고침하면 로그인 상태가 유지되지 않음
- 개발자 도구에서 쿠키를 확인해도 비어있음

**원인**: 
- `withCredentials` 또는 `credentials` 설정이 누락됨
- 서버 CORS 설정 문제
- HTTPS 환경에서 `Secure` 속성 누락
- `SameSite` 속성 설정 문제

**해결 방법**:

#### 1. axios 사용 시
```javascript
// ✅ 올바른 설정
const response = await axios.post(
  'https://api.aiapp.link/login',
  loginData,
  { 
    withCredentials: true  // 중요: 쿠키 포함 설정
  }
);
```

#### 2. fetch 사용 시
```javascript
// ✅ 올바른 설정
const response = await fetch('https://api.aiapp.link/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',  // 중요: 쿠키 포함 설정
  body: JSON.stringify(loginData)
});
```

#### 3. 서버 CORS 설정 확인
서버에서 다음 설정이 필요합니다:
```javascript
// Express.js 예시
app.use(cors({
  origin: ['https://your-domain.com'],
  credentials: true,  // 중요: 쿠키 허용 설정
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### 4. 환경별 쿠키 설정
```javascript
// 프로덕션 환경 (HTTPS)
{
  httpOnly: true,
  secure: true,        // HTTPS에서는 필수
  domain: ".aiapp.link",
  sameSite: "none",    // 크로스 도메인에서는 "none" 필요
  maxAge: 86400
}

// 개발 환경 (HTTP)
{
  httpOnly: true,
  secure: false,       // HTTP에서는 false
  domain: "localhost",
  sameSite: "lax",     // 로컬에서는 "lax" 사용
  maxAge: 86400
}
```

### 서브도메인 간 쿠키 공유 문제

**증상**:
- `app.aiapp.link`에서 로그인했는데 `admin.aiapp.link`에서 로그아웃 상태
- 쿠키는 저장되어 있지만 다른 서브도메인에서 접근 불가

**해결 방법**:
```javascript
// 쿠키 도메인을 .aiapp.link로 설정 (점 포함)
{
  domain: ".aiapp.link",  // 모든 서브도메인에서 접근 가능
  // 다른 설정들...
}
```

## 🌐 CORS 관련 문제

### CORS 정책에 의해 요청이 차단될 때

**증상**:
```
Access to fetch at 'https://api.aiapp.link/login' from origin 'https://your-app.com' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**원인**:
- 서버에서 요청하는 도메인을 허용하지 않음
- Preflight 요청에 대한 적절한 응답이 없음

**해결 방법**:

#### 1. 서버 CORS 설정 (이미 설정되어 있음)
AIApp BaaS 서버는 이미 CORS가 설정되어 있습니다. 문제가 지속되면 다음을 확인하세요:

#### 2. 클라이언트에서 프록시 사용
개발 환경에서 CORS 문제를 우회하려면:

**Next.js**:
```javascript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'https://api.aiapp.link/:path*'
      }
    ];
  }
};
```

**Vite (React/Vue)**:
```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.aiapp.link',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
```

## 🔐 토큰 관련 문제

### 토큰 만료로 인한 401 에러

**증상**:
```json
{
  "error": "Unauthorized",
  "message": "Token expired"
}
```

**해결 방법**:

#### 1. Axios 인터셉터로 자동 처리
```javascript
import axios from 'axios';

// 응답 인터셉터 설정
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 자동 로그아웃 처리
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### 2. React에서 에러 바운더리 사용
```tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export const AuthProvider = ({ children }) => {
  const router = useRouter();

  useEffect(() => {
    const handleUnauthorized = () => {
      // 401 에러 감지 시 로그인 페이지로 이동
      router.push('/login');
    };

    // 전역 에러 핸들러 등록
    window.addEventListener('unauthorized', handleUnauthorized);
    
    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, []);

  return <>{children}</>;
};
```

### 토큰이 헤더에 포함되지 않을 때

**증상**:
- `/info` API 호출 시 403 Forbidden 에러
- "Authorization header missing" 메시지

**해결 방법**:
```javascript
// ✅ 쿠키 방식 (권장) - 자동으로 헤더에 포함됨
const response = await fetch('https://api.aiapp.link/info', {
  credentials: 'include'  // 쿠키가 자동으로 Authorization 헤더로 변환됨
});

// 또는 수동으로 토큰 추가 (권장하지 않음)
const token = localStorage.getItem('access_token');
const response = await fetch('https://api.aiapp.link/info', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🔧 MCP 서버 관련 문제

### MCP 서버가 시작되지 않을 때

**증상**:
- Claude Desktop에서 "MCP server failed to start" 메시지
- 로그에 connection refused 에러

**해결 방법**:

#### 1. 권한 확인
```bash
# MCP 서버 실행 권한 확인
npx @mbaas/baas-mcp@latest --version
```

#### 2. Node.js 버전 확인
```bash
# Node.js 18+ 필요
node --version
```

#### 3. Claude Desktop 설정 재확인
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

### Project ID가 자동으로 적용되지 않을 때

**증상**:
- 생성된 코드에 `[PROJECT_ID]` 플레이스홀더가 그대로 남아있음
- `get-project-config` 도구에서 "Project ID가 설정되지 않았습니다" 메시지

**해결 방법**:

#### 1. 명령줄 인수 방식
```json
{
  "mcpServers": {
    "baas-mcp": {
      "command": "npx",
      "args": [
        "-y", 
        "@mbaas/baas-mcp@latest",
        "--project-id=your-project-uuid"
      ]
    }
  }
}
```

#### 2. 환경 변수 방식
```json
{
  "mcpServers": {
    "baas-mcp": {
      "command": "npx",
      "args": ["-y", "@mbaas/baas-mcp@latest"],
      "env": {
        "BAAS_PROJECT_ID": "your-project-uuid"
      }
    }
  }
}
```

#### 3. Claude Desktop 재시작
설정 변경 후 반드시 Claude Desktop을 재시작하세요.

## 🔍 디버깅 도구

### 네트워크 요청 디버깅

브라우저 개발자 도구에서 네트워크 탭을 확인하세요:

1. **Request Headers 확인**:
   - `Content-Type: application/json`
   - `Cookie: access_token=...` (로그인 후)

2. **Response Headers 확인**:
   - `Set-Cookie` (로그인 시)
   - `Access-Control-Allow-Credentials: true`

3. **Status Code 확인**:
   - 200: 성공
   - 401: 인증 필요 또는 토큰 만료
   - 422: 입력값 오류
   - 500: 서버 에러

### 쿠키 확인 방법

```javascript
// 브라우저 콘솔에서 실행
console.log('All cookies:', document.cookie);

// 특정 쿠키 확인
function getCookie(name) {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1];
}

console.log('Access token:', getCookie('access_token'));
```

## 📞 추가 지원

위의 해결 방법으로 문제가 해결되지 않으면:

- 📧 Email: support@aiapp.link
- 🐛 GitHub Issues: https://github.com/aiapp/baas-mcp/issues
- 📚 문서: https://docs.aiapp.link

**문제 신고 시 포함할 정보**:
1. 사용 중인 브라우저와 버전
2. 발생한 에러 메시지 (전체 스택 트레이스)
3. 사용한 코드 스니펫
4. 브라우저 개발자 도구의 네트워크 탭 스크린샷
5. 기대하는 동작과 실제 동작의 차이

---

**Built with ❤️ by AIApp Team**