# 로그아웃 API

AIApp BaaS 인증 시스템의 로그아웃 API 명세서입니다.

## 기본 정보

- **URL**: `/account/logout`
- **Method**: `POST`
- **Authorization**: Bearer Token 또는 Cookie 인증 필요
- **Description**: 현재 로그인한 사용자를 로그아웃하고 쿠키를 삭제합니다.

## 요청 스키마

POST 메서드이지만 요청 본문이 없습니다. 인증은 Headers 또는 쿠키를 통해 수행됩니다.

## 요청

### Headers

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

또는 쿠키를 통한 자동 인증 (credentials: 'include' 설정)

### 요청 예시

```javascript
// Bearer Token 방식
fetch('https://api.aiapp.link/account/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Cookie 방식 (권장)
fetch('https://api.aiapp.link/account/logout', {
  method: 'POST',
  credentials: 'include'
});
```

## 응답 스키마

### 성공 응답 (200 OK)

```json
{
  "success": true,
  "message": "로그아웃이 완료되었습니다."
}
```

**쿠키 자동 삭제**:
서버에서 자동으로 `access_token` 쿠키를 삭제합니다.
- **key**: `access_token`
- **domain**: `.aiapp.link`
- **path**: `/`
- **maxAge**: `0` (즉시 만료)

### 에러 응답

#### 401 Unauthorized
```json
{
  "errorCode": "UNAUTHORIZED",
  "message": "인증이 필요합니다"
}
```

#### 422 Validation Error
```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "요청 값이 올바르지 않습니다.",
  "detail": [
    {
      "field": "authorization",
      "message": "유효하지 않은 토큰입니다"
    }
  ]
}
```

#### 500 Internal Server Error
```json
{
  "errorCode": "INTERNAL_SERVER_ERROR",
  "message": "예기치 못한 오류가 발생했습니다"
}
```

## 구현 예제

### JavaScript/Fetch

```javascript
const logout = async () => {
  try {
    const response = await fetch('https://api.aiapp.link/account/logout', {
      method: 'POST',
      credentials: 'include', // 쿠키 자동 관리
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '로그아웃 실패');
    }

    const result = await response.json();
    
    // 로그인 페이지로 리다이렉트
    window.location.href = '/login';
    
    return result;
  } catch (error) {
    console.error('로그아웃 실패:', error);
    throw error;
  }
};
```

### React Hook

```typescript
import { useState } from 'react';

export const useLogout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.aiapp.link/account/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '로그아웃 실패');
      }

      const result = await response.json();
      
      // 로컬 상태 정리
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading, error };
};
```

### Vue Composition API

```typescript
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export function useLogout() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const router = useRouter();

  const logout = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('https://api.aiapp.link/account/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '로그아웃 실패');
      }

      const result = await response.json();
      
      // 로그인 페이지로 리다이렉트
      await router.push('/login');
      
      return result;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return { logout, loading, error };
}
```

## 보안 고려사항

1. **토큰 무효화**: 서버에서 JWT 토큰을 블랙리스트에 추가하여 무효화
2. **쿠키 삭제**: HttpOnly 쿠키를 안전하게 삭제
3. **세션 정리**: 서버 세션 및 관련 데이터 정리
4. **로컬 정리**: 클라이언트에서 로컬 스토리지 및 세션 스토리지 정리

## 관련 문서

- [로그인 API](./login.md)
- [회원가입 API](./signup.md)
- [사용자 정보 조회 API](./info.md)
- [쿠키 설정 가이드](../../security/cookies.md)