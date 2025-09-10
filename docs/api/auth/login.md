# 로그인 API

AIApp BaaS 인증 시스템의 로그인 API 명세서입니다.

## 기본 정보

- **URL**: `/account/login`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Description**: 사용자 인증 후 JWT 토큰을 발급하고 쿠키를 설정합니다. 각 프로젝트는 독립적인 인증을 위해 project_id가 필수입니다.

## 요청 스키마

### 필수 필드

```json
{
  "user_id": "string",      // 사용자 ID
  "user_pw": "string",      // 비밀번호
  "project_id": "string"    // 프로젝트 ID (UUID) - 필수
}
```

## 요청 예시

### 로그인 요청

```json
{
  "user_id": "johndoe",
  "user_pw": "password123",
  "project_id": "[PROJECT_ID]"
}
```

## 응답 스키마

### 성공 응답 (200 OK)

```json
{
  "success": true,
  "message": "로그인이 완료되었습니다.",
  "data": {
    "user": {
      "id": "user-uuid-here",
      "user_id": "johndoe",
      "name": "John Doe",
      "phone": "010-1234-5678",
      "is_reserved": false,
      "created_at": "2024-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2024-01-16T10:30:00Z"
  }
}
```

### 쿠키 설정

로그인 성공 시 자동으로 설정되는 쿠키:

```http
Set-Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; Domain=.aiapp.link; SameSite=None; Max-Age=86400; Path=/
```

### 에러 응답

#### 401 Unauthorized (인증 실패)
```json
{
  "success": false,
  "message": "아이디 또는 비밀번호가 올바르지 않습니다.",
  "error_code": "INVALID_CREDENTIALS"
}
```

#### 422 Validation Error
```json
{
  "success": false,
  "message": "입력값이 올바르지 않습니다.",
  "detail": [
    {
      "loc": ["body", "user_id"],
      "msg": "사용자 ID를 입력해주세요.",
      "type": "value_error.missing"
    }
  ]
}
```

## 구현 예제

### JavaScript/Fetch

```javascript
const login = async (credentials) => {
  try {
    const response = await fetch('https://api.aiapp.link/account/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include' // 쿠키 포함
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('로그인 실패:', error);
    throw error;
  }
};
```

### React Hook

```typescript
import { useState } from 'react';
import axios from 'axios';

interface LoginCredentials {
  user_id: string;
  user_pw: string;
  project_id?: string;
}

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/login', credentials, {
        withCredentials: true
      });
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.status === 422 
        ? '입력값을 확인해주세요.'
        : err.response?.status === 401
        ? '아이디 또는 비밀번호가 올바르지 않습니다.'
        : '로그인에 실패했습니다.';
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
};
```

### Vue Composable

```typescript
import { ref } from 'vue';
import axios from 'axios';

export const useAuth = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const user = ref(null);

  const login = async (credentials: LoginCredentials) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.post('/login', credentials, {
        withCredentials: true
      });
      
      if (response.data.success) {
        user.value = response.data.data.user;
      }
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.status === 401
        ? '아이디 또는 비밀번호가 올바르지 않습니다.'
        : '로그인에 실패했습니다.';
      
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return { login, loading, error, user };
};
```

## JWT 토큰 정보

### 토큰 구조

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": "johndoe",
    "user_uuid": "user-uuid-here",
    "project_id": "[PROJECT_ID]",
    "iat": 1642248600,
    "exp": 1642335000
  }
}
```

### 토큰 사용

API 요청 시 Authorization 헤더에 포함:

```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

## 쿠키 설정

### 프로덕션 환경

```javascript
{
  httpOnly: true,        // XSS 방지
  secure: true,          // HTTPS 전용
  domain: '.aiapp.link', // 서브도메인 공유
  sameSite: 'none',      // 크로스 도메인 허용
  maxAge: 86400,         // 24시간
  path: '/'
}
```

### 개발 환경

```javascript
{
  httpOnly: true,
  secure: false,         // HTTP 허용
  domain: 'localhost',
  sameSite: 'lax',
  maxAge: 86400,
  path: '/'
}
```

## 보안 고려사항

1. **HTTPS 통신**: 모든 로그인 요청은 HTTPS를 통해 전송
2. **Rate Limiting**: 무차별 대입 공격 방지를 위한 요청 제한
3. **토큰 만료**: JWT 토큰의 적절한 만료 시간 설정
4. **쿠키 보안**: HttpOnly, Secure, SameSite 속성 활용
5. **CORS 설정**: 적절한 CORS 정책으로 크로스 도메인 보안 강화

## CORS 설정

서버에서 설정해야 할 CORS 정책:

```javascript
// Express.js 예시
app.use(cors({
  origin: ['https://app.aiapp.link', 'https://admin.aiapp.link'],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 관련 문서

- [회원가입 API](../signup.md)
- [사용자 정보 조회 API](../info.md)
- [쿠키 설정 가이드](../../security/cookies.md)
- [JWT 토큰 관리](../../security/jwt.md)
- [에러 처리 가이드](../../dev/error-handling.md)