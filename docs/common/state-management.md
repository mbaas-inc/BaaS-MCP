# 인증 상태 관리 가이드

AIApp BaaS 인증 시스템에서 로그인 상태를 안전하고 올바르게 관리하는 방법에 대한 종합 가이드입니다.

**카테고리**: common
**Keywords**: authentication, state, management, 인증, 상태관리, login, logout, user, cookie, security, react, javascript, UI, display

## 개요

BaaS 인증 시스템은 HttpOnly 쿠키를 사용하여 자동으로 인증 상태를 관리합니다. 클라이언트에서는 올바른 패턴을 사용하여 UI를 제어해야 합니다.

## ❌ 잘못된 패턴 (보안 취약점)

### 1. CSS display 속성으로 요소 숨기기

```javascript
// ❌ 절대 사용하지 말 것!
// DOM에 여전히 존재하여 개발자 도구로 접근 가능
function LoginStatus({ isLoggedIn }) {
  return (
    <div>
      <div style={{ display: isLoggedIn ? 'none' : 'block' }}>
        <LoginForm />
      </div>

      <div style={{ display: isLoggedIn ? 'block' : 'none' }}>
        <SensitiveUserData />  {/* 보안 위험! */}
      </div>
    </div>
  );
}

// ❌ CSS 클래스를 사용한 숨기기도 동일한 문제
<div className={isLoggedIn ? 'hidden' : 'visible'}>
  <AdminPanel />  {/* 여전히 DOM에 존재 */}
</div>
```

**위험성**:
- DOM에 민감한 정보가 여전히 존재
- 개발자 도구로 쉽게 접근 가능
- JavaScript로 display 속성 변경 가능
- 스크린 리더에서 여전히 읽힘

### 2. localStorage/sessionStorage에 인증 정보 저장

```javascript
// ❌ 보안 취약점
localStorage.setItem('isLoggedIn', 'true');
localStorage.setItem('token', userToken);
sessionStorage.setItem('user', JSON.stringify(userData));

// ❌ XSS 공격에 취약
if (localStorage.getItem('isLoggedIn') === 'true') {
  showAdminPanel();
}
```

**위험성**:
- XSS 공격으로 토큰 탈취 가능
- JavaScript로 쉽게 조작 가능
- 브라우저 확장 프로그램에서 접근 가능

### 3. 클라이언트에서만 권한 검증

```javascript
// ❌ 클라이언트 측 검증만으로는 불충분
const user = getLocalUser();
if (user.role === 'admin') {
  return <AdminDashboard />;  // 누구나 조작 가능
}
```

## ✅ 올바른 패턴

### 1. 조건부 렌더링 사용

```javascript
// ✅ 조건부 렌더링 - DOM에서 완전 제거
function LoginStatus({ isLoggedIn }) {
  if (!isLoggedIn) {
    return <LoginForm />;
  }

  return <UserDashboard />;
}

// ✅ 논리 연산자 사용
function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div>
      {!isAuthenticated && <LoginPage />}
      {isAuthenticated && <Dashboard user={user} />}
    </div>
  );
}

// ✅ 삼항 연산자 사용
function Navigation({ isLoggedIn }) {
  return (
    <nav>
      <Logo />
      {isLoggedIn ? (
        <UserMenu />
      ) : (
        <div>
          <LoginButton />
          <SignupButton />
        </div>
      )}
    </nav>
  );
}
```

### 2. 서버 측 인증 상태 확인

```javascript
// ✅ 서버에서 인증 상태 확인
const checkAuthStatus = async () => {
  try {
    const response = await fetch('https://api.aiapp.link/account/info', {
      credentials: 'include'  // HttpOnly 쿠키 자동 포함
    });

    if (response.ok) {
      const userData = await response.json();
      return { isAuthenticated: true, user: userData.data };
    } else {
      return { isAuthenticated: false, user: null };
    }
  } catch (error) {
    return { isAuthenticated: false, user: null };
  }
};

// ✅ 자동 인증 상태 동기화
useEffect(() => {
  checkAuthStatus().then(({ isAuthenticated, user }) => {
    setAuth({ isAuthenticated, user });
  });
}, []);
```

### 3. HttpOnly 쿠키 기반 인증

```javascript
// ✅ BaaS 권장 패턴 - 쿠키 자동 관리
const authAPI = {
  login: async (credentials) => {
    const response = await fetch('https://api.aiapp.link/account/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',  // 쿠키 자동 설정
      body: JSON.stringify(credentials)
    });
    return response.json();
  },

  getUserInfo: async () => {
    const response = await fetch('https://api.aiapp.link/account/info', {
      credentials: 'include'  // 쿠키 자동 포함
    });
    return response.json();
  },

  logout: async () => {
    const response = await fetch('https://api.aiapp.link/account/logout', {
      method: 'POST',
      credentials: 'include'  // 쿠키 자동 삭제
    });
    return response.json();
  }
};
```

## React 구현 패턴

### 1. Context API를 사용한 전역 상태 관리

```tsx
// AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface User {
  id: string;
  user_id: string;
  name: string;
  phone: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; user: User }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_ERROR' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true };
    case 'AUTH_SUCCESS':
      return { isAuthenticated: true, user: action.user, loading: false };
    case 'AUTH_LOGOUT':
      return { isAuthenticated: false, user: null, loading: false };
    case 'AUTH_ERROR':
      return { isAuthenticated: false, user: null, loading: false };
    default:
      return state;
  }
};

const AuthContext = createContext<{
  state: AuthState;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
} | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    loading: true
  });

  const checkAuth = async () => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await fetch('https://api.aiapp.link/account/info', {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        dispatch({ type: 'AUTH_SUCCESS', user: result.data });
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR' });
    }
  };

  const login = async (credentials: any) => {
    try {
      const response = await fetch('https://api.aiapp.link/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        await checkAuth(); // 로그인 후 사용자 정보 재조회
      } else {
        throw new Error('로그인 실패');
      }
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR' });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('https://api.aiapp.link/account/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  useEffect(() => {
    checkAuth(); // 앱 시작 시 인증 상태 확인
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, logout, checkAuth }}>
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

### 2. Protected Route 컴포넌트

```tsx
// ProtectedRoute.tsx
import React from 'react';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback = <div>로그인이 필요합니다.</div>
}) => {
  const { state } = useAuth();

  if (state.loading) {
    return <div>로딩 중...</div>;
  }

  // ✅ 조건부 렌더링으로 접근 제어
  if (!state.isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// 사용 예시
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute fallback={<LoginPage />}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

### 3. 조건부 UI 컴포넌트

```tsx
// ConditionalUI.tsx
import React from 'react';
import { useAuth } from './AuthContext';

export const Navigation: React.FC = () => {
  const { state, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Logo />
      </div>

      <div className="navbar-menu">
        {/* ✅ 조건부 렌더링으로 메뉴 제어 */}
        {state.isAuthenticated ? (
          <div className="user-menu">
            <span>안녕하세요, {state.user?.name}님</span>
            <button onClick={() => logout()}>로그아웃</button>
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login">로그인</Link>
            <Link to="/signup">회원가입</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export const Dashboard: React.FC = () => {
  const { state } = useAuth();

  // ✅ 인증된 사용자만 렌더링
  if (!state.isAuthenticated || !state.user) {
    return null; // 또는 리다이렉트
  }

  return (
    <div className="dashboard">
      <h1>대시보드</h1>
      <UserProfile user={state.user} />
      <UserActions />
    </div>
  );
};
```

## Vanilla JavaScript 구현 패턴

### 1. 인증 상태 관리 클래스

```javascript
// AuthManager.js
class AuthManager {
  constructor() {
    this.isAuthenticated = false;
    this.user = null;
    this.listeners = [];
  }

  // 이벤트 리스너 등록
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // 상태 변경 알림
  notify() {
    this.listeners.forEach(callback => callback({
      isAuthenticated: this.isAuthenticated,
      user: this.user
    }));
  }

  async checkAuth() {
    try {
      const response = await fetch('https://api.aiapp.link/account/info', {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        this.isAuthenticated = true;
        this.user = result.data;
      } else {
        this.isAuthenticated = false;
        this.user = null;
      }
    } catch (error) {
      this.isAuthenticated = false;
      this.user = null;
    }

    this.notify();
  }

  async login(credentials) {
    try {
      const response = await fetch('https://api.aiapp.link/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        await this.checkAuth();
        return true;
      } else {
        throw new Error('로그인 실패');
      }
    } catch (error) {
      this.isAuthenticated = false;
      this.user = null;
      this.notify();
      throw error;
    }
  }

  async logout() {
    try {
      await fetch('https://api.aiapp.link/account/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } finally {
      this.isAuthenticated = false;
      this.user = null;
      this.notify();
    }
  }
}

// 전역 인스턴스
const authManager = new AuthManager();
```

### 2. DOM 조작을 통한 UI 제어

```javascript
// UIController.js
class UIController {
  constructor(authManager) {
    this.authManager = authManager;
    this.init();
  }

  init() {
    // 인증 상태 변경 시 UI 업데이트
    this.authManager.subscribe((authState) => {
      this.updateUI(authState);
    });

    // 초기 인증 상태 확인
    this.authManager.checkAuth();
  }

  updateUI({ isAuthenticated, user }) {
    this.updateNavigation(isAuthenticated, user);
    this.updateMainContent(isAuthenticated, user);
  }

  updateNavigation(isAuthenticated, user) {
    const navElement = document.getElementById('navigation');

    // ✅ DOM 요소를 완전히 교체
    if (isAuthenticated) {
      navElement.innerHTML = `
        <div class="user-info">
          <span>안녕하세요, ${user.name}님</span>
          <button id="logout-btn">로그아웃</button>
        </div>
      `;

      // 로그아웃 버튼 이벤트 리스너
      document.getElementById('logout-btn').addEventListener('click', () => {
        this.authManager.logout();
      });
    } else {
      navElement.innerHTML = `
        <div class="auth-buttons">
          <button id="login-btn">로그인</button>
          <button id="signup-btn">회원가입</button>
        </div>
      `;

      // 로그인/회원가입 버튼 이벤트 리스너
      document.getElementById('login-btn').addEventListener('click', () => {
        this.showLoginModal();
      });
    }
  }

  updateMainContent(isAuthenticated, user) {
    const mainElement = document.getElementById('main-content');

    // ✅ 조건부로 완전히 다른 컨텐츠 렌더링
    if (isAuthenticated) {
      mainElement.innerHTML = `
        <div class="dashboard">
          <h1>대시보드</h1>
          <div class="user-profile">
            <h2>프로필</h2>
            <p>사용자 ID: ${user.user_id}</p>
            <p>이름: ${user.name}</p>
            <p>전화번호: ${user.phone}</p>
          </div>
        </div>
      `;
    } else {
      mainElement.innerHTML = `
        <div class="welcome">
          <h1>환영합니다</h1>
          <p>로그인하여 더 많은 기능을 이용하세요.</p>
          <button onclick="showLoginModal()">로그인하기</button>
        </div>
      `;
    }
  }

  // ❌ 잘못된 방법 - 숨기기/보이기
  // updateUIWrong(isAuthenticated) {
  //   const loginSection = document.getElementById('login-section');
  //   const dashboardSection = document.getElementById('dashboard-section');
  //
  //   loginSection.style.display = isAuthenticated ? 'none' : 'block';
  //   dashboardSection.style.display = isAuthenticated ? 'block' : 'none';
  // }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  new UIController(authManager);
});
```

## Vue.js 구현 패턴

### 1. Composition API 사용

```javascript
// useAuth.js
import { ref, reactive, onMounted } from 'vue';

export function useAuth() {
  const isAuthenticated = ref(false);
  const user = ref(null);
  const loading = ref(true);

  const state = reactive({
    isAuthenticated,
    user,
    loading
  });

  const checkAuth = async () => {
    loading.value = true;
    try {
      const response = await fetch('https://api.aiapp.link/account/info', {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        isAuthenticated.value = true;
        user.value = result.data;
      } else {
        isAuthenticated.value = false;
        user.value = null;
      }
    } catch (error) {
      isAuthenticated.value = false;
      user.value = null;
    } finally {
      loading.value = false;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await fetch('https://api.aiapp.link/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        await checkAuth();
      } else {
        throw new Error('로그인 실패');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('https://api.aiapp.link/account/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } finally {
      isAuthenticated.value = false;
      user.value = null;
    }
  };

  onMounted(() => {
    checkAuth();
  });

  return {
    state,
    login,
    logout,
    checkAuth
  };
}
```

### 2. 조건부 렌더링 템플릿

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <nav class="navbar">
      <div class="navbar-brand">
        <Logo />
      </div>

      <!-- ✅ v-if/v-else를 사용한 조건부 렌더링 -->
      <div class="navbar-menu">
        <div v-if="authState.isAuthenticated" class="user-menu">
          <span>안녕하세요, {{ authState.user?.name }}님</span>
          <button @click="handleLogout">로그아웃</button>
        </div>
        <div v-else class="auth-buttons">
          <router-link to="/login">로그인</router-link>
          <router-link to="/signup">회원가입</router-link>
        </div>
      </div>
    </nav>

    <main>
      <!-- ✅ 로딩 상태 처리 -->
      <div v-if="authState.loading" class="loading">
        로딩 중...
      </div>

      <!-- ✅ 인증 상태에 따른 라우터 뷰 -->
      <router-view v-else />
    </main>
  </div>
</template>

<script>
import { useAuth } from './composables/useAuth';

export default {
  name: 'App',
  setup() {
    const { state: authState, logout } = useAuth();

    const handleLogout = async () => {
      try {
        await logout();
        this.$router.push('/');
      } catch (error) {
        console.error('로그아웃 실패:', error);
      }
    };

    return {
      authState,
      handleLogout
    };
  }
};
</script>
```

## 보안 체크리스트

### ✅ 필수 보안 설정

- [ ] **조건부 렌더링 사용**: CSS display 대신 v-if, 삼항 연산자 등 사용
- [ ] **서버 측 인증 검증**: 클라이언트 상태와 서버 상태 동기화
- [ ] **HttpOnly 쿠키 사용**: localStorage/sessionStorage에 토큰 저장 금지
- [ ] **credentials: 'include' 설정**: 모든 API 요청에 쿠키 포함
- [ ] **401 에러 처리**: 토큰 만료 시 자동 로그아웃 처리

### ✅ 권장 보안 설정

- [ ] **Protected Routes**: 인증이 필요한 페이지 보호
- [ ] **로딩 상태 표시**: 인증 확인 중 적절한 UI 제공
- [ ] **에러 바운더리**: 인증 관련 에러 적절히 처리
- [ ] **자동 토큰 갱신**: 세션 만료 전 자동 연장

### ⚠️ 주의사항

```javascript
// ❌ 피해야 할 패턴들
// 1. CSS로 숨기기
element.style.display = 'none';
element.classList.add('hidden');

// 2. 로컬 스토리지 사용
localStorage.setItem('token', token);
sessionStorage.setItem('user', userData);

// 3. 클라이언트에서만 권한 체크
if (user.role === 'admin') {
  showAdminPanel(); // 조작 가능
}

// ✅ 올바른 패턴들
// 1. 조건부 렌더링
{isAuthenticated && <SecureContent />}

// 2. 서버 측 검증
const checkPermission = async () => {
  const response = await fetch('/api/check-permission', {
    credentials: 'include'
  });
  return response.ok;
};

// 3. HttpOnly 쿠키 자동 관리
// BaaS가 자동으로 처리 - 개발자가 직접 관리할 필요 없음
```

## 관련 문서

구현 시 다음 문서들을 함께 참조하세요:

- [보안 가이드](./security.md) - HttpOnly 쿠키, CORS, XSS/CSRF 방지
- [에러 처리 가이드](./errors.md) - ServiceException 처리 패턴
- [로그인 구현 가이드](../auth-operations/login.md) - 로그인 API 구현
- [사용자 정보 구현 가이드](../auth-operations/user-info.md) - 인증 상태 확인
- [로그아웃 구현 가이드](../auth-operations/logout.md) - 로그아웃 API 구현