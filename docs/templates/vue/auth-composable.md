# Vue 3 인증 컴포저블

AIApp BaaS와 연동되는 Vue 3 Composition API 인증 컴포저블입니다.

## useAuth 컴포저블

```typescript
// composables/useAuth.ts
import { ref, computed, readonly } from 'vue';
import axios from 'axios';

interface User {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  is_reserved: boolean;
  created_at: string;
  data?: Record<string, any>;
}

interface LoginCredentials {
  user_id: string;
  user_pw: string;
  project_id: string;  // 필수
}

interface SignupData {
  user_id: string;
  user_pw: string;
  name: string;
  phone: string;
  is_reserved: boolean;
  project_id: string;  // 필수
  data?: {
    [key: string]: any;
  };
}

// 전역 상태
const user = ref<User | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// Axios 기본 설정
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'https://api.aiapp.link';

// 401 에러 인터셉터
axios.interceptors.response.use(
  response => response,
  async err => {
    if (err.response?.status === 401) {
      user.value = null;
      error.value = '인증이 만료되었습니다. 다시 로그인해주세요.';
    }
    return Promise.reject(err);
  }
);

export function useAuth() {
  // computed 속성
  const isAuthenticated = computed(() => !!user.value);

  /**
   * 사용자 정보를 서버에서 가져옵니다
   */
  const fetchUser = async () => {
    try {
      const response = await axios.get('/info');
      if (response.data.success) {
        user.value = response.data.data;
        error.value = null;
      }
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch user:', err);
      }
      user.value = null;
    }
  };

  /**
   * 로그인을 수행합니다
   */
  const login = async (credentials: LoginCredentials) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.post('/login', credentials);
      
      if (response.data.success) {
        await fetchUser();
      } else {
        throw new Error(response.data.message || '로그인에 실패했습니다.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.status === 422
        ? '입력값을 확인해주세요.'
        : err.response?.status === 401
        ? '아이디 또는 비밀번호가 올바르지 않습니다.'
        : err.message || '로그인에 실패했습니다.';
      
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 회원가입을 수행합니다
   */
  const signup = async (data: SignupData) => {
    loading.value = true;
    error.value = null;

    // 클라이언트 사이드 검증
    if (data.user_pw.length < 8) {
      error.value = '비밀번호는 최소 8자 이상이어야 합니다.';
      loading.value = false;
      throw new Error(error.value);
    }

    try {
      const response = await axios.post('/signup', data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || '회원가입에 실패했습니다.');
      }
    } catch (err: any) {
      let errorMessage = '회원가입에 실패했습니다.';
      
      if (err.response?.status === 422) {
        const details = err.response.data.detail;
        if (Array.isArray(details) && details.length > 0) {
          errorMessage = details[0].msg || '입력값을 확인해주세요.';
        } else {
          errorMessage = '입력값을 확인해주세요.';
        }
      } else if (err.response?.status === 409) {
        errorMessage = '이미 사용 중인 아이디입니다.';
      }
      
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 로그아웃을 수행합니다
   */
  const logout = async () => {
    loading.value = true;
    error.value = null;

    try {
      // 서버에 로그아웃 요청 (선택사항)
      // await axios.post('/logout');
      
      user.value = null;
      
      // 로그인 페이지로 이동
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Logout error:', err);
      user.value = null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 사용자 정보를 새로고침합니다
   */
  const refresh = async () => {
    loading.value = true;
    error.value = null;

    try {
      await fetchUser();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * 에러를 초기화합니다
   */
  const clearError = () => {
    error.value = null;
  };

  return {
    // 읽기 전용 상태
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    isAuthenticated: readonly(isAuthenticated),

    // 메서드
    login,
    signup,
    logout,
    refresh,
    clearError
  };
}
```

## 인증 가드 컴포저블

```typescript
// composables/useAuthGuard.ts
import { useAuth } from './useAuth';

export function useAuthGuard() {
  const { isAuthenticated, loading } = useAuth();

  // 로딩 완료 후 인증 체크
  if (!loading.value && !isAuthenticated.value) {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
  }

  return {
    isAuthenticated,
    loading
  };
}
```

## 앱 초기화 함수

```typescript
// composables/useAuth.ts에 추가

/**
 * 초기 인증 상태를 확인하는 함수
 * App.vue 등에서 앱 시작 시 한 번 호출
 */
export async function initializeAuth() {
  const { refresh } = useAuth();
  
  try {
    await refresh();
  } catch (error) {
    console.log('No valid authentication found');
  }
}
```

## Vue 플러그인으로 사용

```typescript
// plugins/auth.ts
import type { App } from 'vue';
import { useAuth } from '@/composables/useAuth';

export default {
  install(app: App) {
    app.config.globalProperties.$auth = useAuth();
  }
};
```

## 사용 예제

### 기본 사용법

```vue
<template>
  <div>
    <div v-if="loading">로딩 중...</div>
    
    <div v-else-if="isAuthenticated">
      <h1>환영합니다, {{ user?.name }}님!</h1>
      <p>아이디: {{ user?.user_id }}</p>
      <p>전화번호: {{ user?.phone }}</p>
      <button @click="logout">로그아웃</button>
    </div>
    
    <div v-else>
      <h1>로그인이 필요합니다</h1>
      <LoginForm />
    </div>

    <div v-if="error" class="error">
      {{ error }}
      <button @click="clearError">닫기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth';
import LoginForm from '@/components/LoginForm.vue';

const { user, loading, error, isAuthenticated, logout, clearError } = useAuth();
</script>
```

### 로그인 컴포넌트

```vue
<template>
  <form @submit.prevent="handleLogin">
    <div v-if="error" class="error">{{ error }}</div>
    
    <input
      v-model="form.user_id"
      type="text"
      placeholder="아이디"
      required
    />
    
    <input
      v-model="form.user_pw"
      type="password"
      placeholder="비밀번호"
      required
    />
    
    <button type="submit" :disabled="loading">
      {{ loading ? '로그인 중...' : '로그인' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth';

const { login, loading, error } = useAuth();

const form = ref({
  user_id: '',
  user_pw: '',
  project_id: 'your-project-id'  // 필수 프로젝트 ID
});

const handleLogin = async () => {
  try {
    await login(form.value);
    // 로그인 성공 시 자동으로 사용자 정보가 업데이트됨
  } catch (err) {
    // 에러는 컴포저블에서 자동 처리
  }
};
</script>
```

### 회원가입 컴포넌트

```vue
<template>
  <form @submit.prevent="handleSignup">
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">{{ success }}</div>
    
    <input v-model="form.user_id" type="text" placeholder="아이디" required />
    <input v-model="form.user_pw" type="password" placeholder="비밀번호" required />
    <input v-model="form.name" type="text" placeholder="이름" required />
    <input v-model="form.phone" type="tel" placeholder="전화번호" required />
    
    <label>
      <input v-model="form.is_reserved" type="checkbox" />
      예약 계정으로 생성
    </label>
    
    <button type="submit" :disabled="loading">
      {{ loading ? '가입 중...' : '회원가입' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth';

const { signup, loading, error } = useAuth();

const form = ref({
  user_id: '',
  user_pw: '',
  name: '',
  phone: '',
  is_reserved: false
});

const success = ref('');

const handleSignup = async () => {
  try {
    await signup(form.value);
    success.value = '회원가입이 완료되었습니다. 로그인해주세요.';
    
    // 폼 초기화
    form.value = {
      user_id: '',
      user_pw: '',
      name: '',
      phone: '',
      is_reserved: false
    };
  } catch (err) {
    // 에러는 컴포저블에서 자동 처리
  }
};
</script>
```

### Vue Router 가드와 연동

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    }
  ]
});

router.beforeEach((to, from, next) => {
  const { isAuthenticated, loading } = useAuth();
  
  // 로딩 중이면 대기
  if (loading.value) {
    return next(false);
  }
  
  // 인증이 필요한 페이지
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return next('/login');
  }
  
  // 이미 로그인한 상태에서 로그인 페이지 접근
  if (to.path === '/login' && isAuthenticated.value) {
    return next('/dashboard');
  }
  
  next();
});
```

### Pinia 스토어와 연동

```typescript
// stores/auth.ts
import { defineStore } from 'pinia';
import { useAuth } from '@/composables/useAuth';

export const useAuthStore = defineStore('auth', () => {
  const auth = useAuth();
  
  return {
    ...auth
  };
});
```

### 앱 전역 설정

```typescript
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { initializeAuth } from '@/composables/useAuth';

const app = createApp(App);

// 앱 시작 시 인증 상태 초기화
initializeAuth();

app.mount('#app');
```

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { initializeAuth } from '@/composables/useAuth';

// 앱 시작 시 인증 상태 확인
onMounted(() => {
  initializeAuth();
});
</script>
```

## TypeScript 타입 정의

```typescript
// types/auth.ts
export interface User {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  is_reserved: boolean;
  created_at: string;
  updated_at?: string;
  project_id?: string;
  data?: Record<string, any>;
}

export interface LoginCredentials {
  user_id: string;
  user_pw: string;
  project_id?: string;
}

export interface SignupData {
  user_id: string;
  user_pw: string;
  name: string;
  phone: string;
  is_reserved: boolean;
  project_id?: string;
  data?: Record<string, any>;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token?: string;
    expires_at?: string;
  };
}
```

## 고급 사용법

### 토큰 수동 관리

```typescript
// composables/useAuth.ts에 추가

export function useAuthWithToken() {
  const auth = useAuth();
  
  const setToken = (token: string) => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };
  
  const clearToken = () => {
    delete axios.defaults.headers.common['Authorization'];
  };
  
  return {
    ...auth,
    setToken,
    clearToken
  };
}
```

### 자동 토큰 갱신

```typescript
let refreshTokenTimer: NodeJS.Timeout;

const scheduleTokenRefresh = (expiresIn: number) => {
  clearTimeout(refreshTokenTimer);
  
  // 만료 5분 전에 갱신
  const refreshTime = (expiresIn - 5 * 60) * 1000;
  
  refreshTokenTimer = setTimeout(async () => {
    try {
      await refresh();
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  }, refreshTime);
};
```

## 관련 문서

- [Vue 3 로그인 컴포넌트](../vue/login-component.md)
- [React 인증 시스템](../react/auth-components.md)
- [사용자 정보 조회 API](../../api/auth/info.md)
- [로그인 API 명세](../../api/auth/login.md)