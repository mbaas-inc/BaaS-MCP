# BaaS Authentication Error Handling Guide

## Overview
BaaS 인증 시스템에서 발생할 수 있는 모든 에러 유형과 처리 방법에 대한 종합 가이드입니다.

**카테고리**: security
**Keywords**: error, handling, validation, authentication, debugging, ServiceException

## Error Response Format

### ServiceException 기본 구조

BaaS API는 모든 에러를 ServiceException 형태로 반환합니다:

```json
{
  "errorCode": "ERROR_CODE_NAME",
  "message": "사용자 친화적 에러 메시지",
  "detail": [
    {
      "field": "필드명",
      "message": "필드별 상세 에러 메시지"
    }
  ]
}
```

## HTTP 상태 코드별 분류

### 400 Bad Request
- **INVALID_USER**: 사용자 정보가 올바르지 않습니다
- **INVALID_REQUEST**: 요청 형식이 올바르지 않습니다
- **MISSING_REQUIRED_FIELD**: 필수 필드가 누락되었습니다

### 401 Unauthorized
- **UNAUTHORIZED**: 인증이 필요합니다
- **INVALID_TOKEN**: 유효하지 않은 토큰입니다
- **TOKEN_EXPIRED**: 토큰이 만료되었습니다
- **MISSING_AUTHORIZATION**: 인증 헤더가 누락되었습니다

### 403 Forbidden
- **ACCESS_DENIED**: 접근이 거부되었습니다
- **INSUFFICIENT_PERMISSIONS**: 권한이 부족합니다

### 404 Not Found
- **USER_NOT_FOUND**: 사용자를 찾을 수 없습니다
- **RESOURCE_NOT_FOUND**: 요청한 리소스를 찾을 수 없습니다

### 409 Conflict
- **USER_ALREADY_EXISTS**: 이미 사용 중인 아이디입니다
- **DUPLICATE_ENTRY**: 중복된 데이터입니다

### 422 Validation Error
- **VALIDATION_ERROR**: 요청 값이 올바르지 않습니다
- **INVALID_EMAIL**: 이메일 형식이 올바르지 않습니다
- **INVALID_PHONE**: 전화번호 형식이 올바르지 않습니다
- **PASSWORD_TOO_SHORT**: 비밀번호는 최소 8자 이상이어야 합니다
- **INVALID_PROJECT_ID**: 프로젝트 ID가 올바르지 않습니다

### 429 Too Many Requests
- **RATE_LIMIT_EXCEEDED**: 요청 한도를 초과했습니다
- **TOO_MANY_LOGIN_ATTEMPTS**: 로그인 시도 횟수를 초과했습니다

### 500 Internal Server Error
- **INTERNAL_SERVER_ERROR**: 예기치 못한 오류가 발생했습니다
- **DATABASE_ERROR**: 데이터베이스 오류가 발생했습니다
- **SERVICE_UNAVAILABLE**: 서비스를 사용할 수 없습니다

## 상세 에러 코드 및 처리

### 인증 관련 (AUTH_*)

#### INVALID_USER
```json
{
  "errorCode": "INVALID_USER",
  "message": "사용자 정보가 올바르지 않습니다"
}
```

**클라이언트 처리**:
```javascript
if (error.errorCode === 'INVALID_USER') {
  setError('이메일 또는 비밀번호를 확인해주세요.');
  emailInputRef.current?.focus();
}
```

#### UNAUTHORIZED
```json
{
  "errorCode": "UNAUTHORIZED",
  "message": "인증이 필요합니다"
}
```

**클라이언트 처리**:
```javascript
if (error.errorCode === 'UNAUTHORIZED') {
  // 자동으로 로그인 페이지로 리다이렉트
  window.location.href = '/login';
}
```

#### TOKEN_EXPIRED
```json
{
  "errorCode": "TOKEN_EXPIRED",
  "message": "토큰이 만료되었습니다. 다시 로그인해주세요."
}
```

**자동 처리**: BaaS는 만료된 토큰을 자동으로 감지하고 로그아웃 처리합니다.

### 회원가입 관련 (SIGNUP_*)

#### USER_ALREADY_EXISTS
```json
{
  "errorCode": "USER_ALREADY_EXISTS",
  "message": "이미 사용 중인 아이디입니다"
}
```

**클라이언트 처리**:
```javascript
if (error.errorCode === 'USER_ALREADY_EXISTS') {
  setError('이미 가입된 이메일입니다. 로그인을 진행해주세요.');
  // 로그인 페이지로 이동 제안
}
```

#### PASSWORD_TOO_SHORT
```json
{
  "errorCode": "PASSWORD_TOO_SHORT",
  "message": "비밀번호는 최소 8자 이상이어야 합니다"
}
```

### 유효성 검사 관련 (VALIDATION_*)

#### VALIDATION_ERROR
```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "요청 값이 올바르지 않습니다.",
  "detail": [
    {
      "field": "user_pw",
      "message": "비밀번호는 최소 8자 이상이어야 합니다"
    },
    {
      "field": "phone",
      "message": "전화번호 형식이 올바르지 않습니다"
    }
  ]
}
```

#### INVALID_EMAIL
```json
{
  "errorCode": "INVALID_EMAIL",
  "message": "이메일 형식이 올바르지 않습니다",
  "detail": [
    {
      "field": "email",
      "message": "유효한 이메일 주소를 입력해주세요"
    }
  ]
}
```

#### INVALID_PHONE
```json
{
  "errorCode": "INVALID_PHONE",
  "message": "전화번호 형식이 올바르지 않습니다",
  "detail": [
    {
      "field": "phone",
      "message": "010-1234-5678 형식으로 입력해주세요"
    }
  ]
}
```

### 시스템 관련 (SYSTEM_*)

#### INTERNAL_SERVER_ERROR
```json
{
  "errorCode": "INTERNAL_SERVER_ERROR",
  "message": "예기치 못한 오류가 발생했습니다"
}
```

#### RATE_LIMIT_EXCEEDED
```json
{
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "message": "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요."
}
```

## 클라이언트 에러 처리 가이드

### React Hook 에러 처리 패턴

```typescript
import { useState } from 'react';

interface ApiError {
  errorCode: string;
  message: string;
  detail?: Array<{
    field: string;
    message: string;
  }>;
}

export const useApiErrorHandler = () => {
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: ApiError, status: number) => {
    let message = '';

    switch (error.errorCode) {
      case 'UNAUTHORIZED':
        message = '로그인이 필요합니다.';
        window.location.href = '/login';
        break;

      case 'USER_ALREADY_EXISTS':
        message = '이미 사용 중인 아이디입니다.';
        break;

      case 'PASSWORD_TOO_SHORT':
        message = '비밀번호는 최소 8자 이상이어야 합니다.';
        break;

      case 'VALIDATION_ERROR':
        message = error.detail?.map(d => d.message).join(', ') || '입력값이 올바르지 않습니다.';
        break;

      case 'RATE_LIMIT_EXCEEDED':
        message = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
        break;

      default:
        message = error.message || '오류가 발생했습니다.';
    }

    setError(message);
    return message;
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
};

// 사용 예제
const LoginForm = () => {
  const { error, handleError, clearError } = useApiErrorHandler();
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData, response.status);
        return;
      }

      // 로그인 성공 처리
      window.location.href = '/dashboard';
    } catch (error) {
      setFormError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 폼 필드들 */}
      {(error || formError) && (
        <div className="error-message">
          {error || formError}
        </div>
      )}
    </form>
  );
};
```

### Vanilla JavaScript 에러 처리

```javascript
class AuthErrorHandler {
  constructor() {
    this.errorDisplay = document.getElementById('error-display');
  }

  handleApiError(error, response) {
    if (!response.ok) {
      switch (response.status) {
        case 400:
          return '입력값을 확인해주세요.';

        case 401:
          window.location.href = '/login';
          return '로그인이 필요합니다.';

        case 403:
          return '접근 권한이 없습니다.';

        case 404:
          return '요청한 정보를 찾을 수 없습니다.';

        case 409:
          return '이미 사용 중인 정보입니다.';

        case 422:
          return error.detail?.map(d => d.message).join(', ') || '입력값이 올바르지 않습니다.';

        case 429:
          return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';

        case 500:
        default:
          return '서버 오류가 발생했습니다. 관리자에게 문의해주세요.';
      }
    }
  }

  displayError(message) {
    if (this.errorDisplay) {
      this.errorDisplay.textContent = message;
      this.errorDisplay.style.display = 'block';
    }
  }

  clearError() {
    if (this.errorDisplay) {
      this.errorDisplay.style.display = 'none';
      this.errorDisplay.textContent = '';
    }
  }

  async handleAuthAction(url, options) {
    try {
      this.clearError();

      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = this.handleApiError(errorData, response);
        this.displayError(errorMessage);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API 호출 실패:', error);
      throw error;
    }
  }
}

// 사용 예제
const errorHandler = new AuthErrorHandler();

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    await errorHandler.handleAuthAction('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    // 로그인 성공 처리
    window.location.href = '/dashboard';
  } catch (error) {
    // 에러는 이미 errorHandler에서 표시됨
    console.error('Login failed:', error);
  }
});
```

## 에러 예방 모범 사례

### 1. 클라이언트 사이드 검증

```javascript
const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return '이메일을 입력해주세요.';
    if (!emailRegex.test(email)) return '올바른 이메일 형식이 아닙니다.';
    return null;
  },

  password: (password) => {
    if (!password) return '비밀번호를 입력해주세요.';
    if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return '비밀번호는 영문 대소문자와 숫자를 포함해야 합니다.';
    }
    return null;
  },

  phone: (phone) => {
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (phone && !phoneRegex.test(phone)) {
      return '010-1234-5678 형식으로 입력해주세요.';
    }
    return null;
  }
};

// 실시간 검증
const validateField = (field, value) => {
  const error = validators[field]?.(value);
  setFieldErrors(prev => ({ ...prev, [field]: error }));
  return !error;
};
```

### 2. 사용자 친화적인 메시지

```javascript
const friendlyMessages = {
  'INVALID_USER': '이메일 또는 비밀번호를 다시 확인해주세요.',
  'USER_ALREADY_EXISTS': '이미 가입된 이메일입니다. 로그인을 진행해주세요.',
  'TOKEN_EXPIRED': '로그인 시간이 만료되었습니다. 다시 로그인해주세요.',
  'RATE_LIMIT_EXCEEDED': '보안을 위해 잠시 후 다시 시도해주세요.',
  'INTERNAL_SERVER_ERROR': '일시적인 문제입니다. 잠시 후 다시 시도해주세요.'
};

const getFriendlyMessage = (errorCode) => {
  return friendlyMessages[errorCode] || '문제가 발생했습니다. 다시 시도해주세요.';
};
```

### 3. 자동 재시도 로직

```javascript
const retryableErrorCodes = ['INTERNAL_SERVER_ERROR', 'SERVICE_UNAVAILABLE'];

const apiCallWithRetry = async (url, options, maxRetries = 3) => {
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return await response.json();
      }

      const errorData = await response.json();

      if (retryableErrorCodes.includes(errorData.errorCode) && retryCount < maxRetries) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }

      throw new Error(handleApiError(errorData, response));
    } catch (error) {
      if (retryCount >= maxRetries) {
        throw error;
      }
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
};
```

## 모니터링 및 로깅

### 에러 로깅 시스템

```javascript
const logError = (error, context = {}) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    errorCode: error.errorCode,
    message: error.message,
    detail: error.detail,
    context: context,
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: getCurrentUserId() // 사용자 ID 포함 (있는 경우)
  };

  // 개발 환경에서는 콘솔에 출력
  if (process.env.NODE_ENV === 'development') {
    console.error('BaaS API Error:', errorLog);
  }

  // 프로덕션에서는 로깅 서비스로 전송
  if (process.env.NODE_ENV === 'production') {
    sendToLoggingService(errorLog);
  }
};

// 로깅 서비스 전송 함수
const sendToLoggingService = async (errorLog) => {
  try {
    await fetch('/api/logs/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorLog)
    });
  } catch (error) {
    console.error('Failed to send error log:', error);
  }
};
```

### 에러 추적 및 알림

```javascript
// 중요한 에러에 대한 실시간 알림
const criticalErrors = ['INTERNAL_SERVER_ERROR', 'DATABASE_ERROR', 'SERVICE_UNAVAILABLE'];

const handleCriticalError = (error) => {
  if (criticalErrors.includes(error.errorCode)) {
    // 관리자에게 즉시 알림
    notifyAdministrator(error);
  }
};

// 에러 패턴 분석
const errorPatterns = new Map();

const trackErrorPattern = (errorCode) => {
  const count = errorPatterns.get(errorCode) || 0;
  errorPatterns.set(errorCode, count + 1);

  // 특정 에러가 임계값을 넘으면 알림
  if (count > 10) { // 10번 이상 발생 시
    notifyDevelopmentTeam(`High frequency error: ${errorCode} occurred ${count} times`);
  }
};
```

## 디버깅 도구

### 개발 환경 디버깅

```javascript
if (process.env.NODE_ENV === 'development') {
  // 전역 디버깅 도구 추가
  window.baasDebug = {
    // 현재 인증 상태 확인
    getAuthState: () => {
      return {
        isAuthenticated: !!document.cookie.includes('baas_token'),
        cookies: document.cookie,
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage }
      };
    },

    // 에러 시뮬레이션
    simulateError: (errorCode) => {
      const error = { errorCode, message: `Simulated error: ${errorCode}` };
      console.error('Simulated Error:', error);
      return error;
    },

    // 인증 상태 초기화
    clearAuth: () => {
      document.cookie = 'baas_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    },

    // API 호출 로그
    enableApiLogging: () => {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        console.log('API Call:', args);
        const response = await originalFetch(...args);
        console.log('API Response:', response.status, response.statusText);
        return response;
      };
    }
  };

  console.log('BaaS Debug tools available at window.baasDebug');
}
```

## 관련 문서

- [로그인 구현 가이드](../auth-operations/login.md)
- [회원가입 구현 가이드](../auth-operations/signup.md)
- [사용자 정보 구현 가이드](../auth-operations/user-info.md)
- [로그아웃 구현 가이드](../auth-operations/logout.md)
- [보안 가이드](./security.md)