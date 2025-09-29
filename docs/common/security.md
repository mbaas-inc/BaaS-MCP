# BaaS Authentication Security Guide

## Overview
BaaS 인증 시스템의 보안 모범 사례와 쿠키 설정에 대한 종합 가이드입니다.

**카테고리**: security
**Keywords**: security, cookie, authentication, CSRF, XSS, httpOnly, sameSite, 보안, 쿠키, 인증

## 기본 개념

AIApp BaaS는 JWT 토큰을 HttpOnly 쿠키로 관리하여 XSS 공격을 방지하고, 서브도메인 간 쿠키 공유를 통해 통합 인증을 제공합니다.

## Core Security Principles

### 1. HttpOnly 쿠키 사용
```javascript
// ✅ 올바른 설정 (자동으로 설정됨)
// 쿠키는 JavaScript로 접근할 수 없도록 httpOnly 플래그 사용
document.cookie; // BaaS 인증 쿠키는 여기에 표시되지 않음
```

### 2. Secure 및 SameSite 설정
```javascript
// BaaS에서 자동으로 설정되는 쿠키 옵션:
{
  httpOnly: true,
  secure: true,      // HTTPS에서만 전송
  sameSite: 'Lax',   // CSRF 공격 방지
  domain: '.aiapp.link', // 서브도메인 간 공유
  path: '/'
}
```

## 쿠키 설정

### 프로덕션 환경

```javascript
const cookieOptions = {
  httpOnly: true,        // XSS 공격 방지 (JavaScript 접근 차단)
  secure: true,          // HTTPS 환경에서만 전송
  domain: '.aiapp.link', // 서브도메인 공유
  sameSite: 'None',      // 크로스 도메인 허용 (대소문자 주의)
  maxAge: 86400,         // 24시간 (1일, 초 단위)
  path: '/'              // 모든 경로에서 접근 가능
};

// Express.js 예시
res.cookie('access_token', jwtToken, cookieOptions);
```

### 개발 환경

```javascript
const cookieOptions = {
  httpOnly: true,
  secure: false,         // HTTP 허용
  domain: 'localhost',   // 로컬 도메인
  sameSite: 'lax',       // 로컬 환경에서는 lax
  maxAge: 86400,
  path: '/'
};

// Express.js 예시
res.cookie('access_token', jwtToken, cookieOptions);
```

## Domain Configuration

### .aiapp.link 도메인 설정
BaaS는 `.aiapp.link` 도메인을 사용하여 서브도메인 간 인증 상태를 공유합니다.

```javascript
// 지원되는 도메인 패턴
const supportedDomains = [
  'https://your-app.aiapp.link',
  'https://api.aiapp.link',
  'https://admin.aiapp.link'
];

// 쿠키 도메인 설정
// Domain: .aiapp.link (자동 설정됨)
```

### 서브도메인 공유 시나리오

#### 도메인 구조

```
aiapp.link (메인 도메인)
├── app.aiapp.link (사용자 앱)
├── admin.aiapp.link (관리자 페이지)
├── api.aiapp.link (API 서버)
└── dashboard.aiapp.link (대시보드)
```

#### 쿠키 공유 설정

```javascript
// API 서버 (api.aiapp.link)에서 쿠키 설정
res.cookie('access_token', token, {
  domain: '.aiapp.link',  // 점(.)으로 시작하여 서브도메인 공유
  // ... 기타 옵션
});

// 모든 서브도메인에서 접근 가능:
// - app.aiapp.link
// - admin.aiapp.link
// - dashboard.aiapp.link
```

### CORS 및 크로스 도메인 요청
```javascript
// React/JS에서 credentials 포함 설정
const authRequest = async (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include', // 쿠키 자동 포함
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
};
```

## XSS 방지

### 1. Content Security Policy (CSP)
```html
<!-- 권장 CSP 헤더 설정 -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

### 2. 사용자 입력 검증
```javascript
// ✅ 사용자 입력 필터링
const sanitizeInput = (input) => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// ✅ 이메일 검증
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

## CSRF 방지

### 1. SameSite 쿠키 활용
```javascript
// BaaS는 SameSite=Lax 설정으로 CSRF 공격 방지
// 크로스 사이트 요청에서 쿠키가 자동으로 제한됨
```

### 2. Origin 검증
```javascript
// 서버에서 Origin 헤더 검증 (BaaS에서 자동 처리)
const allowedOrigins = [
  'https://your-app.aiapp.link',
  'https://localhost:3000' // 개발 환경
];
```

## Token Management

### 1. 자동 토큰 갱신
```javascript
// BaaS는 자동으로 토큰을 갱신하고 쿠키를 업데이트
// 클라이언트에서 별도의 토큰 관리 불필요

// React에서 토큰 상태 확인
const { user, isAuthenticated } = useAuth();

// 토큰 만료 시 자동 처리
if (!isAuthenticated) {
  // 자동으로 로그인 페이지로 리다이렉트
}
```

### 2. 세션 만료 처리
```javascript
// 세션 만료 시 자동 정리
const handleSessionExpiry = () => {
  // BaaS가 자동으로 처리:
  // 1. 만료된 쿠키 삭제
  // 2. 클라이언트 상태 초기화
  // 3. 로그인 페이지로 리다이렉트
};
```

## Production Security Checklist

### ✅ 필수 보안 설정
- [ ] HTTPS 사용 (필수)
- [ ] `.aiapp.link` 도메인 설정
- [ ] CSP 헤더 구성
- [ ] 입력 검증 구현
- [ ] 에러 메시지에서 민감한 정보 제거

### ✅ 권장 보안 설정
- [ ] Rate limiting 구현
- [ ] 로그인 시도 제한
- [ ] 보안 헤더 추가 (HSTS, X-Frame-Options 등)
- [ ] 정기적인 보안 감사

### ⚠️ 주의사항
```javascript
// ❌ 피해야 할 패턴
localStorage.setItem('token', token); // 로컬 스토리지에 토큰 저장 금지
sessionStorage.setItem('user', JSON.stringify(user)); // 세션 스토리지 사용 금지

// ✅ BaaS 권장 패턴
// 모든 인증 정보는 httpOnly 쿠키로 자동 관리됨
// 클라이언트에서는 useAuth() 훅이나 AuthManager 사용
```

## 보안 모니터링

### 로그인 이상 활동 감지
```javascript
// BaaS는 다음 이상 활동을 자동 감지:
// 1. 비정상적인 로그인 시도 패턴
// 2. 다중 디바이스에서의 동시 접근
// 3. 지리적으로 이상한 위치에서의 접근

// 클라이언트에서 보안 상태 확인
const { securityStatus } = useAuth();
if (securityStatus?.requiresVerification) {
  // 추가 인증 필요 시 처리
}
```

### 세션 무효화
```javascript
// 의심스러운 활동 감지 시 모든 세션 무효화
const invalidateAllSessions = async () => {
  try {
    await authManager.logoutFromAllDevices();
    console.log('모든 세션이 무효화되었습니다.');
  } catch (error) {
    console.error('세션 무효화 실패:', error);
  }
};
```

## 환경별 서버 구현

### Node.js/Express 서버

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// CORS 설정
app.use(cors({
  origin: [
    'https://app.aiapp.link',
    'https://admin.aiapp.link',
    'https://dashboard.aiapp.link'
  ],
  credentials: true,  // 쿠키 포함 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 로그인 라우트 예시
app.post('/account/login', async (req, res) => {
  try {
    // 인증 로직...
    const token = generateJWT(user);

    // 환경별 쿠키 설정
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      domain: isProduction ? '.aiapp.link' : 'localhost',
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 86400000, // 24시간 (밀리초)
      path: '/'
    };

    res.cookie('access_token', token, cookieOptions);

    res.json({
      success: true,
      message: '로그인 완료',
      data: {
        access_token: token,
        token_type: 'bearer'
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '로그인 실패'
    });
  }
});
```

### Next.js API 라우트

```typescript
// pages/api/auth/account/login.ts 또는 app/api/auth/account/login/route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { user_id, user_pw } = await request.json();

    // 인증 로직...
    const token = await authenticateUser(user_id, user_pw);

    const isProduction = process.env.NODE_ENV === 'production';

    const response = new Response(JSON.stringify({
      success: true,
      message: '로그인 완료',
      data: {
        access_token: token,
        token_type: 'bearer'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': [
          `access_token=${token}; HttpOnly; ${isProduction ? 'Secure;' : ''} Domain=${isProduction ? '.aiapp.link' : 'localhost'}; SameSite=${isProduction ? 'None' : 'Lax'}; Max-Age=86400; Path=/`
        ].join(' ')
      }
    });

    return response;
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '로그인 실패'
    }), { status: 401 });
  }
}
```

### FastAPI/Python 서버

```python
from fastapi import FastAPI, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://app.aiapp.link",
        "https://admin.aiapp.link",
        "https://dashboard.aiapp.link"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/account/login")
async def login(credentials: LoginCredentials, response: Response):
    try:
        # 인증 로직...
        user = authenticate_user(credentials.user_id, credentials.user_pw)
        token = generate_jwt(user)

        # 환경별 쿠키 설정
        is_production = os.getenv("ENV") == "production"

        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=is_production,
            domain=".aiapp.link" if is_production else "localhost",
            samesite="none" if is_production else "lax",
            max_age=86400,
            path="/"
        )

        return {
            "success": True,
            "message": "로그인 완료",
            "data": {
                "access_token": token,
                "token_type": "bearer"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="로그인 실패")
```

## 클라이언트 설정

### JavaScript/Fetch

```javascript
// 쿠키 포함 요청
const response = await fetch('https://api.aiapp.link/account/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',  // 쿠키 포함
  body: JSON.stringify({
    user_id: 'johndoe',
    user_pw: 'password123'
  })
});
```

### Axios 설정

```javascript
import axios from 'axios';

// 전역 설정
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'https://api.aiapp.link';

// 또는 개별 요청
const response = await axios.post('/account/login', {
  user_id: 'johndoe',
  user_pw: 'password123'
}, {
  withCredentials: true
});
```

### React Native

React Native에서는 쿠키가 자동으로 관리되지 않으므로 별도 라이브러리 사용:

```javascript
import CookieManager from '@react-native-cookies/cookies';

// 쿠키 설정
await CookieManager.set('https://api.aiapp.link', {
  name: 'access_token',
  value: token,
  domain: '.aiapp.link',
  path: '/',
  version: '1',
  expires: new Date(Date.now() + 86400000).toISOString()
});

// 쿠키 조회
const cookies = await CookieManager.get('https://api.aiapp.link');
const accessToken = cookies.access_token;
```

## 보안 고려사항

### HTTPS 필수

```javascript
// 프로덕션에서는 반드시 secure: true
const cookieOptions = {
  secure: process.env.NODE_ENV === 'production',
  // SameSite=None 사용 시 Secure 필수
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
};
```

### SameSite 정책

- **None**: 크로스 도메인 요청에서 쿠키 전송 (Secure 필수)
- **Lax**: GET 요청에서만 크로스 도메인 쿠키 전송
- **Strict**: 같은 도메인에서만 쿠키 전송

```javascript
// 환경별 SameSite 설정
const sameSitePolicy = {
  development: 'lax',     // 로컬 개발
  staging: 'none',        // 스테이징 환경
  production: 'none'      // 프로덕션 환경
};
```

### 쿠키 만료 관리

```javascript
// 짧은 만료 시간 + 리프레시 토큰 패턴
const shortLivedToken = {
  maxAge: 900000,  // 15분
  httpOnly: true
};

const refreshToken = {
  maxAge: 604800000,  // 7일
  httpOnly: true,
  path: '/auth/refresh'  // 제한된 경로
};
```

## 문제 해결

### 쿠키가 설정되지 않는 경우

1. **HTTPS 확인**: 프로덕션에서 `secure: true` 사용 시 HTTPS 필수
2. **CORS 설정**: `credentials: true` 설정 확인
3. **도메인 매치**: 쿠키 도메인과 요청 도메인 일치 확인
4. **SameSite 정책**: 크로스 도메인 요청 시 적절한 정책 설정

### 서브도메인에서 쿠키 접근 불가

```javascript
// 잘못된 설정
domain: 'aiapp.link'  // 점 없음 - 정확한 도메인만 매치

// 올바른 설정
domain: '.aiapp.link' // 점 있음 - 서브도메인 포함
```

### 개발 환경 쿠키 문제

```javascript
// localhost에서는 도메인 설정하지 않음
const cookieOptions = {
  domain: process.env.NODE_ENV === 'production' ? '.aiapp.link' : undefined
};
```

## 테스트 방법

### 브라우저 개발자 도구

```javascript
// 콘솔에서 쿠키 확인
document.cookie;

// 특정 쿠키 확인
document.cookie
  .split(';')
  .find(cookie => cookie.includes('access_token'));
```

### cURL 테스트

```bash
# 로그인 요청
curl -c cookies.txt -X POST https://api.aiapp.link/account/login \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "user_pw": "password"}'

# 쿠키 파일 확인
cat cookies.txt

# 쿠키로 인증 API 호출
curl -b cookies.txt https://api.aiapp.link/account/info
```

## 참고 자료

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [MDN HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)