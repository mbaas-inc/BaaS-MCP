# 사용자 정보 조회 구현 가이드

AIApp BaaS 인증 시스템의 사용자 정보 조회 기능을 구현하기 위한 통합 가이드입니다. API 명세부터 React와 Vanilla JavaScript 구현 예제까지 모든 내용을 포함합니다.

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

### 사용자 정보 조회 Hook

```tsx
import { useState, useEffect } from 'react';
import axios from 'axios';

interface UserInfo {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  last_logged_at: string | null;
  created_at: string;
  data?: Record<string, any>;
}

interface UseUserInfoOptions {
  autoFetch?: boolean;
  onError?: (error: any) => void;
  onUnauthorized?: () => void;
}

export const useUserInfo = (options: UseUserInfoOptions = {}) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    autoFetch = true,
    onError,
    onUnauthorized
  } = options;

  const fetchUserInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('https://api.aiapp.link/account/info', {
        withCredentials: true
      });

      if (response.data.success) {
        setUser(response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || '사용자 정보 조회 실패');
      }
    } catch (err: any) {
      const apiError = err.response?.data;
      let errorMessage = '사용자 정보를 불러올 수 없습니다.';

      if (apiError?.errorCode) {
        switch (apiError.errorCode) {
          case 'UNAUTHORIZED':
            onUnauthorized?.();
            errorMessage = '로그인이 필요합니다.';
            break;
          case 'VALIDATION_ERROR':
            errorMessage = '인증 정보가 유효하지 않습니다.';
            break;
          default:
            errorMessage = apiError.message || '사용자 정보 조회 실패';
        }
      }

      setError(errorMessage);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshUserInfo = () => {
    return fetchUserInfo();
  };

  const clearUserInfo = () => {
    setUser(null);
    setError(null);
  };

  useEffect(() => {
    if (autoFetch) {
      fetchUserInfo();
    }
  }, [autoFetch]);

  return {
    user,
    loading,
    error,
    fetchUserInfo,
    refreshUserInfo,
    clearUserInfo
  };
};
```

### 사용자 프로필 컴포넌트

```tsx
import React from 'react';
import { useUserInfo } from './useUserInfo';

interface UserProfileProps {
  className?: string;
  showRefreshButton?: boolean;
  onUnauthorized?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  className = '',
  showRefreshButton = true,
  onUnauthorized
}) => {
  const { user, loading, error, refreshUserInfo } = useUserInfo({
    onUnauthorized: onUnauthorized || (() => {
      window.location.href = '/login';
    })
  });

  const handleRefresh = async () => {
    try {
      await refreshUserInfo();
    } catch (error) {
      // 에러는 hook에서 처리됨
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '없음';
    return new Date(dateString).toLocaleString('ko-KR');
  };

  if (loading) {
    return (
      <div className={`user-profile loading ${className}`}>
        <p>사용자 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`user-profile error ${className}`}>
        <p className="error-message">오류: {error}</p>
        <button onClick={handleRefresh} className="retry-button">
          다시 시도
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`user-profile empty ${className}`}>
        <p>사용자 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={`user-profile ${className}`}>
      <div className="profile-header">
        <h3>프로필</h3>
        {showRefreshButton && (
          <button
            onClick={handleRefresh}
            className="refresh-button"
            disabled={loading}
          >
            새로고침
          </button>
        )}
      </div>

      <div className="profile-content">
        <div className="profile-field">
          <label>사용자 ID</label>
          <span>{user.user_id}</span>
        </div>

        <div className="profile-field">
          <label>이름</label>
          <span>{user.name}</span>
        </div>

        <div className="profile-field">
          <label>전화번호</label>
          <span>{user.phone}</span>
        </div>

        <div className="profile-field">
          <label>가입일</label>
          <span>{formatDate(user.created_at)}</span>
        </div>

        <div className="profile-field">
          <label>마지막 로그인</label>
          <span>{formatDate(user.last_logged_at)}</span>
        </div>

        {user.data && Object.keys(user.data).length > 0 && (
          <div className="profile-field">
            <label>추가 정보</label>
            <div className="custom-data">
              {Object.entries(user.data).map(([key, value]) => (
                <div key={key} className="custom-field">
                  <strong>{key}:</strong> {JSON.stringify(value)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

### Tailwind CSS 스타일링 버전

```tsx
export const UserProfileTailwind: React.FC<UserProfileProps> = ({
  className = '',
  showRefreshButton = true,
  onUnauthorized
}) => {
  const { user, loading, error, refreshUserInfo } = useUserInfo({
    onUnauthorized: onUnauthorized || (() => {
      window.location.href = '/login';
    })
  });

  // ... 로직 동일

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">사용자 정보를 불러오는 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">오류: {error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">프로필</h3>
        {showRefreshButton && (
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 rounded"
          >
            새로고침
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-500">사용자 ID</span>
          <span className="text-sm text-gray-900">{user.user_id}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-500">이름</span>
          <span className="text-sm text-gray-900">{user.name}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-500">전화번호</span>
          <span className="text-sm text-gray-900">{user.phone}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-500">가입일</span>
          <span className="text-sm text-gray-900">{formatDate(user.created_at)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-500">마지막 로그인</span>
          <span className="text-sm text-gray-900">{formatDate(user.last_logged_at)}</span>
        </div>

        {user.data && Object.keys(user.data).length > 0 && (
          <div className="pt-4 border-t">
            <span className="text-sm font-medium text-gray-500 block mb-2">추가 정보</span>
            <div className="space-y-2">
              {Object.entries(user.data).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-sm text-gray-600">{key}:</span>
                  <span className="text-sm text-gray-900">{JSON.stringify(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

## 3. Vanilla JavaScript 구현

### 기본 사용자 정보 조회

```javascript
// 설정
const CONFIG = {
  API_ENDPOINT: 'https://api.aiapp.link',
  LOGIN_URL: '/login'
};

class UserInfoManager {
  constructor() {
    this.user = null;
    this.loading = false;
    this.callbacks = {
      onSuccess: [],
      onError: [],
      onUnauthorized: []
    };
  }

  // 이벤트 리스너 등록
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  // 이벤트 발생
  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  async fetchUserInfo() {
    if (this.loading) return this.user;

    this.loading = true;

    try {
      const response = await fetch(`${CONFIG.API_ENDPOINT}/account/info`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.emit('onUnauthorized', null);
          throw new Error('인증이 필요합니다');
        }

        const errorData = await response.json();
        throw new Error(errorData.message || '사용자 정보 조회 실패');
      }

      const result = await response.json();

      if (result.success) {
        this.user = result.data;
        this.emit('onSuccess', this.user);
        return this.user;
      } else {
        throw new Error(result.message || '사용자 정보 조회 실패');
      }

    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      this.emit('onError', error);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  async refreshUserInfo() {
    this.user = null; // 캐시 무효화
    return await this.fetchUserInfo();
  }

  getUserInfo() {
    return this.user;
  }

  clearUserInfo() {
    this.user = null;
  }

  isLoggedIn() {
    return this.user !== null;
  }

  // DOM에 사용자 정보 렌더링
  renderUserProfile(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }

    const {
      showRefreshButton = true,
      showCustomData = true,
      className = ''
    } = options;

    if (this.loading) {
      container.innerHTML = `
        <div class="user-profile loading ${className}">
          <p>사용자 정보를 불러오는 중...</p>
        </div>
      `;
      return;
    }

    if (!this.user) {
      container.innerHTML = `
        <div class="user-profile error ${className}">
          <p>사용자 정보가 없습니다.</p>
          <button onclick="userInfoManager.loadAndRender('${containerId}', ${JSON.stringify(options)})">
            다시 시도
          </button>
        </div>
      `;
      return;
    }

    const formatDate = (dateString) => {
      if (!dateString) return '없음';
      return new Date(dateString).toLocaleString('ko-KR');
    };

    let customDataHtml = '';
    if (showCustomData && this.user.data && Object.keys(this.user.data).length > 0) {
      customDataHtml = `
        <div class="profile-field">
          <label>추가 정보</label>
          <div class="custom-data">
            ${Object.entries(this.user.data).map(([key, value]) =>
              `<div class="custom-field">
                <strong>${key}:</strong> ${JSON.stringify(value)}
              </div>`
            ).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="user-profile ${className}">
        <div class="profile-header">
          <h3>프로필</h3>
          ${showRefreshButton ? `
            <button onclick="userInfoManager.refreshAndRender('${containerId}', ${JSON.stringify(options)})"
                    class="refresh-button">
              새로고침
            </button>
          ` : ''}
        </div>

        <div class="profile-content">
          <div class="profile-field">
            <label>사용자 ID</label>
            <span>${this.user.user_id}</span>
          </div>

          <div class="profile-field">
            <label>이름</label>
            <span>${this.user.name}</span>
          </div>

          <div class="profile-field">
            <label>전화번호</label>
            <span>${this.user.phone}</span>
          </div>

          <div class="profile-field">
            <label>가입일</label>
            <span>${formatDate(this.user.created_at)}</span>
          </div>

          <div class="profile-field">
            <label>마지막 로그인</label>
            <span>${formatDate(this.user.last_logged_at)}</span>
          </div>

          ${customDataHtml}
        </div>
      </div>
    `;
  }

  // 편의 메서드: 로드 후 렌더링
  async loadAndRender(containerId, options = {}) {
    try {
      await this.fetchUserInfo();
    } catch (error) {
      // 에러는 이미 처리됨
    }
    this.renderUserProfile(containerId, options);
  }

  // 편의 메서드: 새로고침 후 렌더링
  async refreshAndRender(containerId, options = {}) {
    try {
      await this.refreshUserInfo();
    } catch (error) {
      // 에러는 이미 처리됨
    }
    this.renderUserProfile(containerId, options);
  }
}

// 전역 인스턴스 생성
const userInfoManager = new UserInfoManager();

// 기본 이벤트 리스너 설정
userInfoManager.on('onUnauthorized', () => {
  alert('로그인이 필요합니다.');
  window.location.href = CONFIG.LOGIN_URL;
});

userInfoManager.on('onError', (error) => {
  console.error('사용자 정보 오류:', error);
});

// 전역 함수로 노출
window.userInfoManager = userInfoManager;
```

### HTML 사용 예제

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>사용자 프로필</title>
    <style>
        .user-profile {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-family: Arial, sans-serif;
        }

        .profile-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }

        .profile-header h3 {
            margin: 0;
            color: #333;
        }

        .refresh-button {
            padding: 6px 12px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }

        .refresh-button:hover {
            background-color: #0056b3;
        }

        .profile-content {
            space: 1rem 0;
        }

        .profile-field {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f0f0f0;
        }

        .profile-field:last-child {
            border-bottom: none;
        }

        .profile-field label {
            font-weight: bold;
            color: #555;
            width: 120px;
        }

        .profile-field span {
            flex: 1;
            text-align: right;
            color: #333;
        }

        .custom-data {
            flex: 1;
        }

        .custom-field {
            text-align: right;
            margin-bottom: 5px;
            font-size: 14px;
        }

        .loading {
            text-align: center;
            color: #666;
            padding: 40px 0;
        }

        .error {
            text-align: center;
            color: #dc3545;
        }

        .error button {
            margin-top: 10px;
            padding: 8px 16px;
            background-color: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        .user-card {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .user-avatar {
            width: 50px;
            height: 50px;
            background-color: #007bff;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>마이페이지</h1>

        <!-- 사용자 카드 (간단한 정보) -->
        <div id="userCard"></div>

        <!-- 상세 프로필 -->
        <div id="userProfile"></div>

        <!-- 다른 설정들 -->
        <div style="margin-top: 40px;">
          <button onclick="handleLogout()">로그아웃</button>
        </div>
    </div>

    <script>
        // UserInfoManager 클래스 코드 (위에서 정의한 코드)
        // ... UserInfoManager 코드 ...

        // 사용자 카드 렌더링
        function renderUserCard() {
            const user = userInfoManager.getUserInfo();
            const container = document.getElementById('userCard');

            if (!user) {
                container.innerHTML = '';
                return;
            }

            const initial = user.name.charAt(0).toUpperCase();
            container.innerHTML = `
                <div class="user-card">
                    <div class="user-avatar">${initial}</div>
                    <div>
                        <div><strong>${user.name}</strong></div>
                        <div style="color: #666; font-size: 14px;">${user.user_id}</div>
                    </div>
                </div>
            `;
        }

        // 이벤트 리스너 설정
        userInfoManager.on('onSuccess', () => {
            renderUserCard();
        });

        // 로그아웃 처리
        function handleLogout() {
            if (window.logoutManager) {
                window.logoutManager.logout();
            } else {
                // 간단한 로그아웃
                fetch('/account/logout', {
                    method: 'POST',
                    credentials: 'include'
                }).then(() => {
                    window.location.href = '/login';
                });
            }
        }

        // 페이지 로드 시 사용자 정보 조회
        document.addEventListener('DOMContentLoaded', async () => {
            await userInfoManager.loadAndRender('userProfile', {
                showRefreshButton: true,
                showCustomData: true
            });
        });
    </script>
</body>
</html>
```

## 4. 인증 상태 관리

### React Context 패턴

```tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface User {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  last_logged_at: string | null;
  created_at: string;
  data?: Record<string, any>;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'AUTH_ERROR':
      return {
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case 'AUTH_LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    default:
      return state;
  }
};

const AuthContext = createContext<{
  state: AuthState;
  fetchUser: () => Promise<void>;
  logout: () => void;
} | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  });

  const fetchUser = async () => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await fetch('https://api.aiapp.link/account/info', {
        credentials: 'include'
      });

      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '사용자 정보 조회 실패');
      }

      const result = await response.json();

      if (result.success) {
        dispatch({ type: 'AUTH_SUCCESS', payload: result.data });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') {
        dispatch({ type: 'AUTH_LOGOUT' });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: error.message });
      }
    }
  };

  const logout = () => {
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ state, fetchUser, logout }}>
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
```

## 5. 보안 고려사항

### 인증 상태 검증

1. **페이지 로드 시 자동 검증**: 사용자 정보 API로 인증 상태 확인
2. **토큰 만료 처리**: 401 오류 시 자동 로그인 페이지 이동
3. **로컬 스토리지 동기화**: API 응답과 로컬 저장 데이터 일치 확인

### 민감 정보 처리

1. **커스텀 데이터**: 민감한 정보는 별도 API로 분리
2. **로그 보안**: 사용자 정보를 콘솔에 출력하지 않도록 주의
3. **캐싱 정책**: 민감한 정보는 메모리에만 저장

## 6. 에러 처리

### 주요 에러 코드

| 에러 코드 | 설명 | 처리 방법 |
|-----------|------|-----------|
| `UNAUTHORIZED` | 인증되지 않음 | 로그인 페이지로 리다이렉트 |
| `VALIDATION_ERROR` | 유효하지 않은 토큰 | 로그인 페이지로 리다이렉트 |
| `INTERNAL_SERVER_ERROR` | 서버 오류 | 재시도 옵션 제공 |

### 에러 처리 전략

1. **자동 재시도**: 네트워크 오류 시 자동 재시도
2. **사용자 친화적 메시지**: 기술적 오류를 이해하기 쉬운 언어로 변환
3. **폴백 UI**: 오류 시에도 기본적인 UI 제공

## 7. 관련 문서

- [로그인 구현 가이드](./login.md)
- [회원가입 구현 가이드](./signup.md)
- [로그아웃 구현 가이드](./logout.md)
- [보안 설정 가이드](../common/security.md)
- [에러 처리 가이드](../common/errors.md)