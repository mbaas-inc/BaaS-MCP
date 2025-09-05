# Vue 3 로그인 컴포넌트

AIApp BaaS와 연동되는 Vue 3 로그인 컴포넌트입니다.

## 기본 로그인 컴포넌트

```vue
<template>
  <div class="login-container">
    <form @submit.prevent="handleSubmit" class="login-form">
      <h2>로그인</h2>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div class="form-group">
        <label for="user_id">아이디</label>
        <input
          type="text"
          id="user_id"
          v-model="form.user_id"
          placeholder="아이디를 입력하세요"
          required
          :disabled="loading"
        />
      </div>

      <div class="form-group">
        <label for="user_pw">비밀번호</label>
        <input
          type="password"
          id="user_pw"
          v-model="form.user_pw"
          placeholder="비밀번호를 입력하세요"
          required
          :disabled="loading"
        />
      </div>

      <div class="form-group">
        <label>프로젝트 ID</label>
        <input
          type="text"
          :value="projectId"
          disabled
          style="background-color: #f5f5f5;"
        />
      </div>

      <button 
        type="submit" 
        :disabled="loading"
        class="submit-button"
      >
        {{ loading ? '로그인 중...' : '로그인' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

// Props 정의
interface Props {
  projectId: string;  // 필수 프로젝트 ID
  apiEndpoint?: string;
}

const props = withDefaults(defineProps<Props>(), {
  apiEndpoint: 'https://api.aiapp.link'
});

// Emits 정의
const emit = defineEmits<{
  success: [data: any];
  error: [error: any];
}>();

// 반응형 상태
interface LoginForm {
  user_id: string;
  user_pw: string;
}

const form = ref<LoginForm>({
  user_id: '',
  user_pw: ''
});

const loading = ref(false);
const error = ref<string | null>(null);

// Axios 기본 설정
axios.defaults.withCredentials = true;

// 로그인 처리
const handleSubmit = async () => {
  loading.value = true;
  error.value = null;

  try {
    const loginData = {
      user_id: form.value.user_id,
      user_pw: form.value.user_pw,
      project_id: props.projectId
    };

    const response = await axios.post(
      `${props.apiEndpoint}/login`,
      loginData
    );

    if (response.data.success) {
      emit('success', response.data.data);
      // 기본 동작: 대시보드로 이동
      window.location.href = '/dashboard';
    }
  } catch (err: any) {
    const errorMessage = err.response?.status === 422 
      ? '입력값을 확인해주세요.' 
      : err.response?.status === 401 
      ? '아이디 또는 비밀번호가 올바르지 않습니다.'
      : '로그인에 실패했습니다.';
    
    error.value = errorMessage;
    emit('error', err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-weight: 600;
  color: #374151;
}

.form-group input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.submit-button {
  background-color: #3b82f6;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.submit-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.error-message {
  background-color: #fef2f2;
  color: #dc2626;
  padding: 12px;
  border: 1px solid #fecaca;
  border-radius: 4px;
  margin-bottom: 16px;
}

h2 {
  text-align: center;
  margin-bottom: 24px;
  color: #1f2937;
}
</style>
```

## Tailwind CSS 버전

```vue
<template>
  <div class="max-w-md mx-auto p-6">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <h2 class="text-2xl font-bold text-center mb-6">로그인</h2>
      
      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {{ error }}
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          아이디
        </label>
        <input
          type="text"
          v-model="form.user_id"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="아이디를 입력하세요"
          required
          :disabled="loading"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          비밀번호
        </label>
        <input
          type="password"
          v-model="form.user_pw"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="비밀번호를 입력하세요"
          required
          :disabled="loading"
        />
      </div>

      <div v-if="includeProjectId">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          프로젝트 ID (선택사항)
        </label>
        <input
          type="text"
          v-model="form.project_id"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="프로젝트 ID를 입력하세요"
          :disabled="loading"
        />
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
      >
        {{ loading ? '로그인 중...' : '로그인' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
// ... 동일한 스크립트 로직
</script>
```

## Options API 버전

```vue
<template>
  <!-- 동일한 템플릿 -->
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import axios from 'axios';

interface LoginForm {
  user_id: string;
  user_pw: string;
  project_id?: string;
}

export default defineComponent({
  name: 'LoginComponent',
  props: {
    includeProjectId: {
      type: Boolean,
      default: false
    },
    apiEndpoint: {
      type: String,
      default: 'https://api.aiapp.link'
    }
  },
  emits: ['success', 'error'],
  setup(props, { emit }) {
    const form = ref<LoginForm>({
      user_id: '',
      user_pw: '',
      project_id: ''
    });
    
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Axios 기본 설정
    axios.defaults.withCredentials = true;

    const handleSubmit = async () => {
      loading.value = true;
      error.value = null;

      try {
        const loginData = {
          user_id: form.value.user_id,
          user_pw: form.value.user_pw,
          ...(props.includeProjectId && form.value.project_id && { 
            project_id: form.value.project_id 
          })
        };

        const response = await axios.post(
          `${props.apiEndpoint}/login`,
          loginData
        );

        if (response.data.success) {
          emit('success', response.data.data);
          window.location.href = '/dashboard';
        }
      } catch (err: any) {
        const errorMessage = err.response?.status === 422 
          ? '입력값을 확인해주세요.' 
          : err.response?.status === 401 
          ? '아이디 또는 비밀번호가 올바르지 않습니다.'
          : '로그인에 실패했습니다.';
        
        error.value = errorMessage;
        emit('error', err);
      } finally {
        loading.value = false;
      }
    };

    return {
      form,
      loading,
      error,
      handleSubmit
    };
  }
});
</script>
```

## 사용 예제

### 부모 컴포넌트에서 사용

```vue
<template>
  <div>
    <LoginComponent
      project-id="[PROJECT_ID]"
      api-endpoint="https://api.aiapp.link"
      @success="handleLoginSuccess"
      @error="handleLoginError"
    />
  </div>
</template>

<script setup lang="ts">
import LoginComponent from './components/LoginComponent.vue';

const handleLoginSuccess = (userData: any) => {
  console.log('로그인 성공:', userData);
  // 성공 후 처리 로직
};

const handleLoginError = (error: any) => {
  console.error('로그인 실패:', error);
  // 에러 처리 로직
};
</script>
```

### Vue Router와 연동

```vue
<template>
  <div>
    <LoginComponent @success="redirectToDashboard" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import LoginComponent from './components/LoginComponent.vue';

const router = useRouter();

const redirectToDashboard = (userData: any) => {
  // 사용자 데이터를 스토어에 저장
  // store.commit('setUser', userData);
  
  // 대시보드로 이동
  router.push('/dashboard');
};
</script>
```

### Pinia 스토어와 연동

```typescript
// stores/auth.ts
import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    loading: false,
    error: null as string | null
  }),

  actions: {
    async login(credentials: { user_id: string; user_pw: string; project_id?: string }) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.post('/login', credentials, {
          withCredentials: true
        });

        if (response.data.success) {
          this.user = response.data.data.user;
          return response.data;
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || '로그인에 실패했습니다.';
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});
```

```vue
<!-- LoginPage.vue -->
<template>
  <div>
    <LoginComponent @success="handleLogin" />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async (userData: any) => {
  // 스토어에 사용자 정보 설정
  authStore.user = userData.user;
  
  // 대시보드로 리디렉션
  router.push('/dashboard');
};
</script>
```

## 커스터마이징

### 스타일 커스터마이징

```vue
<style scoped>
/* 커스텀 색상 적용 */
.submit-button {
  background-color: #10b981; /* emerald-500 */
}

.submit-button:hover:not(:disabled) {
  background-color: #059669; /* emerald-600 */
}

/* 다크 모드 지원 */
@media (prefers-color-scheme: dark) {
  .login-container {
    background-color: #1f2937;
    color: white;
  }
  
  .form-group input {
    background-color: #374151;
    border-color: #4b5563;
    color: white;
  }
}
</style>
```

### 추가 필드 지원

```vue
<template>
  <!-- 기존 필드들 -->
  
  <div class="form-group" v-if="showRememberMe">
    <label class="flex items-center">
      <input
        type="checkbox"
        v-model="form.rememberMe"
        class="mr-2"
      />
      로그인 상태 유지
    </label>
  </div>
</template>

<script setup lang="ts">
interface Props {
  includeProjectId?: boolean;
  showRememberMe?: boolean;
  apiEndpoint?: string;
}

const props = withDefaults(defineProps<Props>(), {
  includeProjectId: false,
  showRememberMe: false,
  apiEndpoint: 'https://api.aiapp.link'
});

const form = ref({
  user_id: '',
  user_pw: '',
  project_id: '',
  rememberMe: false
});
</script>
```

## 관련 문서

- [Vue 3 인증 컴포저블](../vue/auth-composable.md)
- [React 인증 컴포넌트](../react/auth-components.md)
- [쿠키 설정 가이드](../../security/cookies.md)
- [로그인 API 명세](../../api/auth/login.md)