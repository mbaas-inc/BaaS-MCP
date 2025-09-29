# 사용자 정보 조회 구현 가이드

AIApp BaaS 인증 시스템의 사용자 정보 조회 기능을 구현하기 위한 핵심 가이드입니다.

**Keywords**: user-info, 사용자정보, profile, 프로필, 인증상태, auth-check, 내정보
**Focus**: 사용자 정보 API 구현, 인증 상태 확인, React/JavaScript 예제

## 1. API 명세

### 기본 정보

- **URL**: `/account/info`
- **Method**: `GET`
- **Base URL**: `https://api.aiapp.link`
- **Authorization**: Bearer Token 또는 Cookie 인증 필요
- **Description**: 현재 로그인한 사용자의 정보를 조회합니다.

### 요청 스키마

GET 메서드이므로 요청 본문이 없습니다. 인증은 Headers 또는 쿠키를 통해 수행됩니다.

#### Headers (선택사항)

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

쿠키를 통한 자동 인증 사용 시 Authorization Header는 불필요합니다.

### 요청 예시

#### Cookie 방식 (권장)
```javascript
fetch('https://api.aiapp.link/account/info', {
  method: 'GET',
  credentials: 'include'
});
```

#### Bearer Token 방식
```javascript
fetch('https://api.aiapp.link/account/info', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 응답 스키마

#### 성공 응답 (200 OK)

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

#### 필드 설명

- **id**: 사용자 고유 ID (UUID)
- **user_id**: 사용자 로그인 ID
- **name**: 사용자 이름
- **phone**: 전화번호
- **last_logged_at**: 마지막 로그인 시간 (null 가능)
- **created_at**: 계정 생성 시간
- **data**: 사용자 커스텀 데이터 (Object)

#### 에러 응답

##### 401 Unauthorized
```json
{
  "errorCode": "UNAUTHORIZED",
  "message": "인증이 필요합니다"
}
```

##### 422 Validation Error
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

## 2. React 구현

### React Hook 구현

```tsx
import { useState, useEffect } from 'react';

interface UserInfo {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  last_logged_at: string | null;
  created_at: string;
  data?: Record<string, any>;
}

export const useUserInfo = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.aiapp.link/account/info', {
        credentials: 'include'
      });

      if (response.status === 401) {
        setUser(null);
        setError('로그인이 필요합니다');
        return null;
      }

      const result = await response.json();
      if (result.success) {
        setUser(result.data);
        return result.data;
      } else {
        throw new Error(result.message || '사용자 정보 조회 실패');
      }
    } catch (err) {
      setError('사용자 정보를 불러올 수 없습니다.');
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return {
    user,
    loading,
    error,
    refreshUserInfo: fetchUserInfo,
    isLoggedIn: !!user
  };
};
```

### 프로필 컴포넌트

```tsx
export const UserProfile = () => {
  const { user, loading, error, refreshUserInfo, isLoggedIn } = useUserInfo();

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>오류: {error}</div>;
  if (!isLoggedIn) return <div>로그인이 필요합니다.</div>;

  return (
    <div className="user-profile">
      <h3>프로필</h3>
      <p>ID: {user.user_id}</p>
      <p>이름: {user.name}</p>
      <p>전화: {user.phone}</p>
      <button onClick={refreshUserInfo}>새로고침</button>
    </div>
  );
};
```

## 3. Vanilla JavaScript 구현

```javascript
class UserInfoManager {
  constructor() {
    this.user = null;
    this.loading = false;
  }

  async fetchUserInfo() {
    if (this.loading) return this.user;

    this.loading = true;
    try {
      const response = await fetch('https://api.aiapp.link/account/info', {
        credentials: 'include'
      });

      if (response.status === 401) {
        this.user = null;
        throw new Error('로그인이 필요합니다');
      }

      const result = await response.json();
      if (result.success) {
        this.user = result.data;
        return this.user;
      } else {
        throw new Error(result.message || '사용자 정보 조회 실패');
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  renderUserProfile(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.loading) {
      container.innerHTML = '<div>로딩 중...</div>';
      return;
    }

    if (!this.user) {
      container.innerHTML = '<div>사용자 정보가 없습니다.</div>';
      return;
    }

    container.innerHTML = `
      <div class="user-profile">
        <h3>프로필</h3>
        <p>ID: ${this.user.user_id}</p>
        <p>이름: ${this.user.name}</p>
        <p>전화: ${this.user.phone}</p>
        <button onclick="userInfoManager.refreshAndRender('${containerId}')">
          새로고침
        </button>
      </div>
    `;
  }

  async refreshAndRender(containerId) {
    this.user = null;
    await this.fetchUserInfo();
    this.renderUserProfile(containerId);
  }
}

// 사용 예시
const userInfoManager = new UserInfoManager();
window.userInfoManager = userInfoManager;
```

## 4. 관련 문서

### 구현 시 필수 참조 문서
- [상태 관리 가이드](../common/state-management.md) - 인증 상태 기반 UI 제어
- [보안 가이드](../common/security.md) - HttpOnly 쿠키 자동 인증, 401 에러 처리

### 관련 API 구현 문서
- [로그인 구현 가이드](./login.md)
- [회원가입 구현 가이드](./signup.md)
- [로그아웃 구현 가이드](./logout.md)