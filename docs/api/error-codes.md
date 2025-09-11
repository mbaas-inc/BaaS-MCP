# BaaS API 에러 코드 명세서

AIApp BaaS 시스템의 공통 에러 처리 및 에러 코드 명세서입니다.

## 에러 응답 구조

### ServiceException 기본 구조

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

## 상세 에러 코드

### 인증 관련 (AUTH_*)

#### INVALID_USER
```json
{
  "errorCode": "INVALID_USER",
  "message": "사용자 정보가 올바르지 않습니다"
}
```

#### UNAUTHORIZED
```json
{
  "errorCode": "UNAUTHORIZED",
  "message": "인증이 필요합니다"
}
```

#### TOKEN_EXPIRED
```json
{
  "errorCode": "TOKEN_EXPIRED",
  "message": "토큰이 만료되었습니다. 다시 로그인해주세요."
}
```

### 회원가입 관련 (SIGNUP_*)

#### USER_ALREADY_EXISTS
```json
{
  "errorCode": "USER_ALREADY_EXISTS",
  "message": "이미 사용 중인 아이디입니다"
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

### JavaScript 에러 처리 패턴

```javascript
const handleApiError = (error, response) => {
  if (!response.ok) {
    switch (response.status) {
      case 400:
        // Bad Request - 사용자 입력 오류
        return '입력값을 확인해주세요.';
      
      case 401:
        // Unauthorized - 인증 필요
        window.location.href = '/login';
        return '로그인이 필요합니다.';
      
      case 403:
        // Forbidden - 권한 부족
        return '접근 권한이 없습니다.';
      
      case 404:
        // Not Found - 리소스 없음
        return '요청한 정보를 찾을 수 없습니다.';
      
      case 409:
        // Conflict - 중복 데이터
        return '이미 사용 중인 정보입니다.';
      
      case 422:
        // Validation Error - 유효성 검사 실패
        return error.detail?.map(d => d.message).join(', ') || '입력값이 올바르지 않습니다.';
      
      case 429:
        // Too Many Requests - 요청 한도 초과
        return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      
      case 500:
      default:
        // Internal Server Error - 서버 오류
        return '서버 오류가 발생했습니다. 관리자에게 문의해주세요.';
    }
  }
};

// 사용 예제
const apiCall = async (url, options) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = handleApiError(errorData, response);
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API 호출 실패:', error);
    throw error;
  }
};
```

### React Hook 에러 처리

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
        // 로그인 페이지로 리다이렉트
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
```

### Vue Composition API 에러 처리

```typescript
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export function useApiErrorHandler() {
  const error = ref<string | null>(null);
  const router = useRouter();

  const handleError = (apiError: any, status: number) => {
    let message = '';

    switch (apiError.errorCode) {
      case 'UNAUTHORIZED':
        message = '로그인이 필요합니다.';
        router.push('/login');
        break;
      
      case 'USER_ALREADY_EXISTS':
        message = '이미 사용 중인 아이디입니다.';
        break;
      
      case 'VALIDATION_ERROR':
        message = apiError.detail?.map((d: any) => d.message).join(', ') || '입력값이 올바르지 않습니다.';
        break;
      
      default:
        message = apiError.message || '오류가 발생했습니다.';
    }

    error.value = message;
    return message;
  };

  const clearError = () => {
    error.value = null;
  };

  return { error, handleError, clearError };
}
```

## 모니터링 및 로깅

### 에러 로깅 가이드

```javascript
const logError = (error, context) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    errorCode: error.errorCode,
    message: error.message,
    context: context,
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // 로깅 서비스로 전송
  console.error('BaaS API Error:', errorLog);
  
  // 필요시 외부 로깅 서비스로 전송
  // sendToLoggingService(errorLog);
};
```

## 관련 문서

- [로그인 API](./auth/login.md)
- [회원가입 API](./auth/signup.md)
- [사용자 정보 조회 API](./auth/info.md)
- [로그아웃 API](./auth/logout.md)