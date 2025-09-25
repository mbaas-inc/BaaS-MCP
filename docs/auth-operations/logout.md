# 로그아웃 구현 가이드

AIApp BaaS 인증 시스템의 로그아웃 기능을 구현하기 위한 통합 가이드입니다. API 명세부터 React와 Vanilla JavaScript 구현 예제까지 모든 내용을 포함합니다.

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

### 로그아웃 Hook

```tsx
import { useState } from 'react';
import axios from 'axios';

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
      const response = await axios.post('https://api.aiapp.link/account/logout', {}, {
        withCredentials: true
      });

      if (response.data.success) {
        // 로컬 상태 정리
        localStorage.removeItem('user');
        localStorage.removeItem('userInfo');
        sessionStorage.clear();

        // 성공 콜백 실행
        options?.onSuccess?.();

        // 페이지 이동
        const redirectTo = options?.redirectTo || '/login';
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 500);
      }
    } catch (err: any) {
      const apiError = err.response?.data;
      let errorMessage = '로그아웃에 실패했습니다.';

      if (apiError?.errorCode) {
        switch (apiError.errorCode) {
          case 'UNAUTHORIZED':
            // 이미 로그아웃된 상태일 수 있으므로 정리 후 로그인 페이지로
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/login';
            return;
          default:
            errorMessage = apiError.message || '로그아웃에 실패했습니다.';
        }
      }

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
import React from 'react';
import { useLogout } from './useLogout';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  redirectTo?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  className = '',
  children = '로그아웃',
  onSuccess,
  onError,
  redirectTo
}) => {
  const { logout, loading, error } = useLogout({
    onSuccess,
    onError,
    redirectTo
  });

  const handleClick = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await logout();
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`logout-button ${className}`}
      >
        {loading ? '로그아웃 중...' : children}
      </button>
      {error && (
        <div className="error-message" style={{ marginTop: '8px' }}>
          {error}
        </div>
      )}
    </>
  );
};
```

### Tailwind CSS 스타일링 버전

```tsx
export const LogoutButtonTailwind: React.FC<LogoutButtonProps> = ({
  className = '',
  children = '로그아웃',
  onSuccess,
  onError,
  redirectTo
}) => {
  const { logout, loading, error } = useLogout({
    onSuccess,
    onError,
    redirectTo
  });

  const handleClick = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await logout();
    }
  };

  return (
    <div className="logout-container">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`px-4 py-2 bg-red-500 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold rounded focus:outline-none focus:shadow-outline transition-colors ${className}`}
      >
        {loading ? '로그아웃 중...' : children}
      </button>
      {error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  );
};
```

### Context와 함께 사용하는 예제

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { logout: logoutAPI, loading } = useLogout({
    onSuccess: () => {
      setUser(null);
      setIsAuthenticated(false);
    }
  });

  const logout = async () => {
    await logoutAPI();
  };

  return (
    <AuthContext.Provider value={{ user, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 사용 예제
export const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header>
      {isAuthenticated && (
        <div>
          <span>환영합니다, {user?.name}님</span>
          <button onClick={logout}>로그아웃</button>
        </div>
      )}
    </header>
  );
};
```

## 3. Vanilla JavaScript 구현

### 기본 로그아웃 기능

```javascript
// 설정
const CONFIG = {
  API_ENDPOINT: 'https://api.aiapp.link',
  LOGIN_URL: '/login'
};

class LogoutManager {
  constructor() {
    this.loading = false;
  }

  async logout(options = {}) {
    if (this.loading) return;

    const {
      confirmMessage = '로그아웃 하시겠습니까?',
      redirectTo = CONFIG.LOGIN_URL,
      onSuccess = null,
      onError = null,
      clearStorage = true
    } = options;

    // 확인 메시지
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    this.loading = true;

    try {
      const response = await fetch(`${CONFIG.API_ENDPOINT}/account/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 로컬 스토리지 정리
        if (clearStorage) {
          this.clearLocalData();
        }

        // 성공 콜백
        if (onSuccess) {
          onSuccess(result);
        }

        // 페이지 이동
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 500);

      } else {
        throw new Error(result.message || '로그아웃에 실패했습니다.');
      }

    } catch (error) {
      console.error('로그아웃 실패:', error);

      // 인증 오류인 경우 강제로 정리 후 로그인 페이지로
      if (error.message?.includes('인증') || error.message?.includes('UNAUTHORIZED')) {
        this.clearLocalData();
        window.location.href = redirectTo;
        return;
      }

      // 에러 콜백
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
    // 로컬 스토리지 정리
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('authToken');

    // 세션 스토리지 정리
    sessionStorage.clear();

    console.log('로컬 데이터가 정리되었습니다.');
  }

  // 자동 로그아웃 (토큰 만료 등)
  autoLogout(reason = '세션이 만료되었습니다.') {
    this.clearLocalData();
    alert(reason + ' 다시 로그인해주세요.');
    window.location.href = CONFIG.LOGIN_URL;
  }

  // 로그아웃 버튼에 이벤트 리스너 등록
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

// 전역 로그아웃 매니저 인스턴스
const logoutManager = new LogoutManager();

// DOM이 로드되면 이벤트 바인딩
document.addEventListener('DOMContentLoaded', () => {
  logoutManager.bindLogoutButtons();
});

// 전역 함수로 노출
window.logout = (options) => logoutManager.logout(options);
```

### HTML 사용 예제

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>대시보드</title>
    <style>
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background-color: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
        }

        .logout-btn {
            padding: 8px 16px;
            background-color: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.2s;
        }

        .logout-btn:hover {
            background-color: #c82333;
        }

        .logout-btn:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }

        .user-menu {
            position: relative;
            display: inline-block;
        }

        .dropdown-content {
            display: none;
            position: absolute;
            right: 0;
            background-color: white;
            min-width: 160px;
            box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
            border-radius: 4px;
            z-index: 1;
        }

        .dropdown-content.show {
            display: block;
        }

        .dropdown-content a {
            color: black;
            padding: 12px 16px;
            text-decoration: none;
            display: block;
        }

        .dropdown-content a:hover {
            background-color: #f1f1f1;
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>대시보드</h1>

        <!-- 방법 1: 단순 버튼 -->
        <button class="logout-btn" data-logout>로그아웃</button>

        <!-- 방법 2: 사용자 메뉴 드롭다운 -->
        <!--
        <div class="user-menu">
            <button onclick="toggleDropdown()">홍길동 님 ▼</button>
            <div id="userDropdown" class="dropdown-content">
                <a href="/profile">프로필</a>
                <a href="/settings">설정</a>
                <a href="#" data-logout>로그아웃</a>
            </div>
        </div>
        -->
    </header>

    <main>
        <p>대시보드 내용...</p>

        <!-- 다른 위치의 로그아웃 버튼 -->
        <button onclick="logout({ confirmMessage: '정말 로그아웃 하시겠습니까?' })">
            로그아웃
        </button>
    </main>

    <!-- 로그아웃 스크립트 포함 -->
    <script>
        // LogoutManager 클래스 코드 (위에서 정의한 코드)
        // ... LogoutManager 코드 ...

        // 드롭다운 토글 함수 (선택사항)
        function toggleDropdown() {
            const dropdown = document.getElementById('userDropdown');
            dropdown.classList.toggle('show');
        }

        // 드롭다운 외부 클릭 시 닫기
        window.addEventListener('click', function(event) {
            const dropdown = document.getElementById('userDropdown');
            if (dropdown && !event.target.matches('.user-menu button')) {
                dropdown.classList.remove('show');
            }
        });

        // 자동 로그아웃 감지 (토큰 만료 등)
        window.addEventListener('beforeunload', () => {
            // 페이지를 떠날 때 정리 작업 (선택사항)
        });

        // API 요청 시 401 에러 감지하여 자동 로그아웃
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            return originalFetch.apply(this, args)
                .then(response => {
                    if (response.status === 401) {
                        logoutManager.autoLogout('인증이 만료되었습니다.');
                    }
                    return response;
                })
                .catch(error => {
                    throw error;
                });
        };
    </script>
</body>
</html>
```

## 4. 보안 고려사항

### 토큰 무효화

1. **서버 측 처리**: JWT 토큰을 블랙리스트에 추가하여 무효화
2. **쿠키 삭제**: HttpOnly 쿠키를 안전하게 삭제
3. **세션 정리**: 서버 세션 및 관련 데이터 정리

### 클라이언트 측 정리

1. **로컬 스토리지**: 사용자 정보, 토큰 등 모든 인증 관련 데이터 삭제
2. **세션 스토리지**: 임시 데이터 모두 정리
3. **메모리 정리**: 애플리케이션 상태에서 사용자 정보 제거

### 자동 로그아웃 처리

```javascript
// API 응답 인터셉터로 401 오류 감지
const handleUnauthorized = () => {
  localStorage.clear();
  sessionStorage.clear();
  alert('세션이 만료되었습니다. 다시 로그인해주세요.');
  window.location.href = '/login';
};

// Axios 인터셉터 예제 (React)
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);
```

## 5. 에러 처리

### 주요 에러 코드

| 에러 코드 | 설명 | 처리 방법 |
|-----------|------|-----------|
| `UNAUTHORIZED` | 인증 정보 없음 | 로그인 페이지로 이동 |
| `VALIDATION_ERROR` | 유효하지 않은 토큰 | 강제 로그아웃 후 로그인 페이지 이동 |
| `INTERNAL_SERVER_ERROR` | 서버 오류 | 재시도 또는 관리자 문의 안내 |

### 에러 처리 전략

1. **Graceful Degradation**: 로그아웃 API 실패 시에도 로컬 데이터를 정리하고 로그인 페이지로 이동
2. **사용자 알림**: 명확하고 친절한 에러 메시지 제공
3. **자동 복구**: 401 오류 시 자동으로 로그인 페이지로 이동

## 6. 사용 시나리오

### 일반 로그아웃
- 사용자가 로그아웃 버튼 클릭
- 확인 메시지 표시
- API 호출 및 로컬 데이터 정리
- 로그인 페이지로 이동

### 자동 로그아웃
- 토큰 만료 감지
- 세션 타임아웃
- 보안 정책에 의한 강제 로그아웃

### 오류 상황 처리
- 네트워크 오류 시 로컬 정리 후 이동
- 서버 오류 시 재시도 옵션 제공

## 7. 관련 문서

- [로그인 구현 가이드](./login.md)
- [회원가입 구현 가이드](./signup.md)
- [사용자 정보 조회 가이드](./user-info.md)
- [보안 설정 가이드](../common/security.md)
- [에러 처리 가이드](../common/errors.md)