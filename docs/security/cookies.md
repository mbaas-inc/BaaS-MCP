# 쿠키 설정 가이드

AIApp BaaS 인증 시스템의 쿠키 설정 및 서브도메인 공유 가이드입니다.

## 기본 개념

AIApp BaaS는 JWT 토큰을 HttpOnly 쿠키로 관리하여 XSS 공격을 방지하고, 서브도메인 간 쿠키 공유를 통해 통합 인증을 제공합니다.

## 쿠키 설정

### 프로덕션 환경

```javascript
const cookieOptions = {
  httpOnly: true,        // XSS 공격 방지
  secure: true,          // HTTPS 환경에서만 전송
  domain: '.aiapp.link', // 서브도메인 공유
  sameSite: 'none',      // 크로스 도메인 허용
  maxAge: 86400,         // 24시간 (초 단위)
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

## 환경별 설정

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
      message: '로그인 성공',
      data: { user }
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
      message: '로그인 성공'
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
            "message": "로그인 성공",
            "data": {"user": user}
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

## 서브도메인 공유 시나리오

### 도메인 구조

```
aiapp.link (메인 도메인)
├── app.aiapp.link (사용자 앱)
├── admin.aiapp.link (관리자 페이지)
├── api.aiapp.link (API 서버)
└── dashboard.aiapp.link (대시보드)
```

### 쿠키 공유 설정

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

## 관련 문서

- [JWT 토큰 관리](jwt.md)
- [CORS 설정 가이드](cors.md)
- [인증 API 명세](../api/auth/account/login.md)
- [Next.js 인증 미들웨어](../templates/nextjs/auth-middleware.md)