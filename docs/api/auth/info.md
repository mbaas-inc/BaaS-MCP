# 사용자 정보 조회 API

AIApp BaaS 인증 시스템의 사용자 정보 조회 API 명세서입니다.

## 기본 정보

- **URL**: `/account/info`
- **Method**: `GET`
- **Authorization**: Bearer Token 또는 Cookie 인증 필요
- **Description**: 현재 로그인한 사용자의 정보를 조회합니다.

## 요청 스키마

GET 메서드이므로 요청 본문이 없습니다. 인증은 Headers 또는 쿠키를 통해 수행됩니다.

## 요청

### Headers

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

또는 쿠키를 통한 자동 인증 (credentials: 'include' 설정)

### 요청 예시

```javascript
// Bearer Token 방식
fetch('https://api.aiapp.link/account/info', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Cookie 방식 (권장)
fetch('https://api.aiapp.link/account/info', {
  method: 'GET',
  credentials: 'include'
});
```

## 응답 스키마

### 성공 응답 (200 OK)

```json
{
  "success": true,
  "message": "내 정보",
  "data": {
    "id": "user-uuid-here",
    "user_id": "johndoe",
    "name": "John Doe",
    "phone": "010-1234-5678",
    "last_logged_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-15T09:00:00Z",
    "data": {
      "age": 25,
      "interests": ["coding", "music"]
    }
  }
}
```

### 필드 설명

- **id**: 사용자 고유 ID (UUID)
- **user_id**: 사용자 로그인 ID
- **name**: 사용자 이름
- **phone**: 전화번호
- **last_logged_at**: 마지막 로그인 시간 (null 가능)
- **created_at**: 계정 생성 시간
- **data**: 사용자 커스텀 데이터 (Object)

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
const getUserInfo = async () => {
  try {
    const response = await fetch('https://api.aiapp.link/account/info', {
      method: 'GET',
      credentials: 'include', // 쿠키 자동 관리
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) {
        // 로그인 페이지로 리다이렉트
        window.location.href = '/login';
        return;
      }
      throw new Error(errorData.message || '사용자 정보 조회 실패');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
    throw error;
  }
};
```

### React Hook

```typescript
import { useState, useEffect } from 'react';

interface UserInfo {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  last_logged_at: string | null;
  created_at: string;
  data: Record<string, any>;
}

export const useUserInfo = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://api.aiapp.link/account/info', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('로그인이 필요합니다');
        }
        throw new Error('사용자 정보를 불러올 수 없습니다');
      }

      const result = await response.json();
      setUserInfo(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return { userInfo, loading, error, refetch: fetchUserInfo };
};
```

## 보안 고려사항

1. **인증 토큰 검증**: 모든 요청에서 유효한 JWT 토큰 또는 쿠키 확인
2. **HTTPS 통신**: 민감한 사용자 정보는 HTTPS를 통해서만 전송
3. **토큰 만료 처리**: 토큰 만료 시 적절한 재로그인 처리
4. **개인정보 보호**: 응답에서 민감한 정보 (비밀번호 등) 제외

## 관련 문서

- [로그인 API](./login.md)
- [회원가입 API](./signup.md)
- [로그아웃 API](./logout.md)
- [JWT 토큰 관리](../../security/jwt.md)