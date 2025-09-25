# BaaS Authentication Security Guide

## Overview
BaaS 인증 시스템의 보안 모범 사례와 쿠키 설정에 대한 종합 가이드입니다.

**카테고리**: security
**Keywords**: security, cookie, authentication, CSRF, XSS, httpOnly, sameSite

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

## 참고 자료

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [MDN HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)