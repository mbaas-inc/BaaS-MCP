# 로그아웃 구현 가이드

AIApp BaaS 인증 시스템의 로그아웃 기능을 구현하기 위한 핵심 가이드입니다.

**Keywords**: logout, 로그아웃, signout, session-clear, token-invalidate, 세션종료, 인증해제, HTML, JavaScript, Vanilla, vanilla
**Focus**: 로그아웃 API 구현, 쿠키 자동 삭제, HTML/Vanilla JavaScript/React 예제

## 1. API 명세

### 기본 정보

- **URL**: `/account/logout`
- **Method**: `POST`
- **Base URL**: `https://api.aiapp.link`
- **Authorization**: Bearer Token 또는 Cookie 인증 필요
- **Description**: 현재 로그인한 사용자를 로그아웃하고 쿠키를 삭제합니다.

### 요청 스키마

POST 메서드이지만 요청 본문이 없습니다. 인증은 Headers 또는 쿠키를 통해 수행됩니다.

#### Headers (선택사항)

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

쿠키를 통한 자동 인증 사용 시 Authorization Header는 불필요합니다.

### 요청 예시

#### Cookie 방식 (권장)
```javascript
fetch('https://api.aiapp.link/account/logout', {
  method: 'POST',
  credentials: 'include'
});
```

#### Bearer Token 방식
```javascript
fetch('https://api.aiapp.link/account/logout', {
  method: 'POST',
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
  "result": "SUCCESS",
  "message": "로그아웃이 완료되었습니다."
}
```

**쿠키 자동 삭제**:
서버에서 자동으로 `access_token` 쿠키를 삭제합니다.
- **key**: `access_token`
- **domain**: `.aiapp.link`
- **path**: `/`
- **maxAge**: `0` (즉시 만료)

#### 에러 응답

##### 401 Unauthorized
```json
{
  "result": "FAIL",
  "errorCode": "UNAUTHORIZED",
  "message": "인증이 필요합니다"
}
```

##### 422 Validation Error
```json
{
  "result": "FAIL",
  "errorCode": "VALIDATION_ERROR",
  "message": "요청 값이 올바르지 않습니다.",
  "detail": [
    {
      "field": "authorization",
      "reason": "유효하지 않은 토큰입니다"
    }
  ]
}
```

## 2. React 구현

### 로그아웃 Hook

```tsx
import { useState } from 'react';

interface LogoutOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  redirectTo?: string;
}

export const useLogout = (options?: LogoutOptions) => {
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

      const result = await response.json();

      if (result.result === 'SUCCESS') {
        localStorage.removeItem('user');
        sessionStorage.clear();

        options?.onSuccess?.();

        const redirectTo = options?.redirectTo || '/login';
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 500);
      }
    } catch (err: any) {
      const errorMessage = '로그아웃에 실패했습니다.';
      setError(errorMessage);
      options?.onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading, error };
};
```

### 로그아웃 버튼 컴포넌트

```tsx
export const LogoutButton = ({ onSuccess, redirectTo }) => {
  const { logout, loading, error } = useLogout({ onSuccess, redirectTo });

  const handleClick = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await logout();
    }
  };

  return (
    <>
      <button onClick={handleClick} disabled={loading}>
        {loading ? '로그아웃 중...' : '로그아웃'}
      </button>
      {error && <div className="error">{error}</div>}
    </>
  );
};
```

## 3. Vanilla JavaScript 구현

```javascript
class LogoutManager {
  constructor() {
    this.loading = false;
  }

  async logout(options = {}) {
    if (this.loading) return;

    const {
      confirmMessage = '로그아웃 하시겠습니까?',
      redirectTo = '/login',
      onSuccess = null,
      onError = null
    } = options;

    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    this.loading = true;

    try {
      const response = await fetch('https://api.aiapp.link/account/logout', {
        method: 'POST',
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.result === 'SUCCESS') {
        this.clearLocalData();

        if (onSuccess) onSuccess(result);

        setTimeout(() => {
          window.location.href = redirectTo;
        }, 500);
      } else {
        throw new Error(result.message || '로그아웃에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그아웃 실패:', error);

      if (error.message?.includes('인증') || error.message?.includes('UNAUTHORIZED')) {
        this.clearLocalData();
        window.location.href = redirectTo;
        return;
      }

      if (onError) {
        onError(error);
      } else {
        alert('로그아웃 중 오류가 발생했습니다: ' + error.message);
      }
    } finally {
      this.loading = false;
    }
  }

  clearLocalData() {
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');
    sessionStorage.clear();
  }

  autoLogout(reason = '세션이 만료되었습니다.') {
    this.clearLocalData();
    alert(reason + ' 다시 로그인해주세요.');
    window.location.href = '/login';
  }

  bindLogoutButtons() {
    const logoutButtons = document.querySelectorAll('[data-logout]');
    logoutButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    });
  }
}

// 전역 인스턴스 생성
const logoutManager = new LogoutManager();

// DOM 로드 시 이벤트 바인딩
document.addEventListener('DOMContentLoaded', () => {
  logoutManager.bindLogoutButtons();
});

// 전역 함수로 노출
window.logout = (options) => logoutManager.logout(options);
```

### HTML 사용 예시

```html
<!-- 기본 로그아웃 버튼 -->
<button data-logout>로그아웃</button>

<!-- 커스텀 옵션 -->
<button onclick="logout({ confirmMessage: '정말 로그아웃 하시겠습니까?' })">
  로그아웃
</button>

<!-- 자동 로그아웃 감지 -->
<script>
// API 요청 시 401 에러 감지하여 자동 로그아웃
const originalFetch = window.fetch;
window.fetch = function(...args) {
  return originalFetch.apply(this, args)
    .then(response => {
      if (response.status === 401) {
        logoutManager.autoLogout('인증이 만료되었습니다.');
      }
      return response;
    });
};
</script>
```

## 4. 보안 고려사항

### 자동 적용 보안 설정

- ✅ **HttpOnly 쿠키 삭제**: 서버에서 자동으로 쿠키 무효화
- ✅ **토큰 무효화**: JWT 토큰을 블랙리스트에 추가
- ✅ **세션 정리**: 서버 세션 및 관련 데이터 정리
- ✅ **자동 로그아웃**: 401 에러 시 자동 처리

### 에러 처리 전략

1. **Graceful Degradation**: API 실패 시에도 로컬 데이터 정리 후 로그인 페이지 이동
2. **자동 복구**: 401 오류 시 자동으로 로그인 페이지로 이동
3. **사용자 알림**: 명확하고 친절한 에러 메시지 제공

## 5. 관련 문서

### 구현 시 필수 참조 문서
- [상태 관리 가이드](../common/state-management.md) - 로그아웃 후 UI 상태 초기화
- [보안 가이드](../common/security.md) - HttpOnly 쿠키 자동 삭제, 세션 무효화

### 관련 API 구현 문서
- [로그인 구현 가이드](./login.md)
- [회원가입 구현 가이드](./signup.md)
- [사용자 정보 조회 가이드](./user-info.md)