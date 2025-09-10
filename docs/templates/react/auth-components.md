# React 인증 컴포넌트

AIApp BaaS와 연동되는 React 인증 컴포넌트 템플릿입니다.

## 로그인 컴포넌트

### 기본 로그인 폼

```tsx
import React, { useState } from 'react';
import axios from 'axios';

interface LoginFormProps {
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
  className?: string;
  projectId: string;  // 필수 프로젝트 ID
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onError,
  className = '',
  projectId
}) => {
  const [form, setForm] = useState({
    user_id: '',
    user_pw: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loginData = {
        user_id: form.user_id,
        user_pw: form.user_pw,
        project_id: projectId
      };

      const response = await axios.post('/account/login', loginData, {
        withCredentials: true
      });

      if (response.data.success) {
        onSuccess?.(response.data.data);
      }
    } catch (err: any) {
      const errorMessage = err.response?.status === 422 
        ? '입력값을 확인해주세요.' 
        : err.response?.status === 401 
        ? '아이디 또는 비밀번호가 올바르지 않습니다.'
        : '로그인에 실패했습니다.';
      
      setError(errorMessage);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`login-form ${className}`}>
      <h2>로그인</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="user_id">아이디</label>
        <input
          type="text"
          id="user_id"
          value={form.user_id}
          onChange={(e) => setForm({...form, user_id: e.target.value})}
          placeholder="아이디를 입력하세요"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="user_pw">비밀번호</label>
        <input
          type="password"
          id="user_pw"
          value={form.user_pw}
          onChange={(e) => setForm({...form, user_pw: e.target.value})}
          placeholder="비밀번호를 입력하세요"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label>프로젝트 ID</label>
        <input
          type="text"
          value={projectId}
          disabled
          className="disabled-field"
          style={{ backgroundColor: '#f5f5f5' }}
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="submit-button"
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
};
```

### Tailwind CSS 스타일링

```tsx
import React, { useState } from 'react';
import axios from 'axios';

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onError }) => {
  // ... 상태 관리 코드 동일

  return (
    <div className="max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            아이디
          </label>
          <input
            type="text"
            value={form.user_id}
            onChange={(e) => setForm({...form, user_id: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="아이디를 입력하세요"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호
          </label>
          <input
            type="password"
            value={form.user_pw}
            onChange={(e) => setForm({...form, user_pw: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="비밀번호를 입력하세요"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
};
```

## 회원가입 컴포넌트

```tsx
import React, { useState } from 'react';
import axios from 'axios';

interface SignupFormProps {
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
  customFields?: string[];
  projectId: string;  // 필수 프로젝트 ID
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSuccess,
  onError,
  customFields = [],
  projectId
}) => {
  const [form, setForm] = useState({
    user_id: '',
    user_pw: '',
    name: '',
    phone: '',
    is_reserved: false,
    data: {} as Record<string, any>
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 클라이언트 검증
    if (form.user_pw.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      const signupData = {
        user_id: form.user_id,
        user_pw: form.user_pw,
        name: form.name,
        phone: form.phone,
        is_reserved: form.is_reserved,
        project_id: projectId,
        ...(customFields.length > 0 && { data: form.data })
      };

      const response = await axios.post('/account/signup', signupData);

      if (response.data.success) {
        onSuccess?.(response.data.data);
      }
    } catch (err: any) {
      let errorMessage = '회원가입에 실패했습니다.';
      
      if (err.response?.status === 422) {
        const details = err.response.data.detail;
        if (Array.isArray(details) && details.length > 0) {
          errorMessage = details[0].msg || '입력값을 확인해주세요.';
        }
      } else if (err.response?.status === 409) {
        errorMessage = '이미 사용 중인 아이디입니다.';
      }
      
      setError(errorMessage);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-2xl font-bold text-center mb-6">회원가입</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            아이디 *
          </label>
          <input
            type="text"
            value={form.user_id}
            onChange={(e) => setForm({...form, user_id: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="4-20자 영문/숫자"
            required
            minLength={4}
            maxLength={20}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호 *
          </label>
          <input
            type="password"
            value={form.user_pw}
            onChange={(e) => setForm({...form, user_pw: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="최소 8자 이상"
            required
            minLength={8}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이름 *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="실명을 입력하세요"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            전화번호 *
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({...form, phone: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="010-1234-5678"
            pattern="010-\d{4}-\d{4}"
            required
          />
        </div>

        {includeProjectId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              프로젝트 ID (선택사항)
            </label>
            <input
              type="text"
              value={form.project_id}
              onChange={(e) => setForm({...form, project_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="프로젝트 ID를 입력하세요"
            />
          </div>
        )}

        {customFields.map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field}
            </label>
            <input
              type="text"
              value={form.data[field] || ''}
              onChange={(e) => setForm({
                ...form, 
                data: {...form.data, [field]: e.target.value}
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`${field}를 입력하세요`}
            />
          </div>
        ))}

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_reserved"
            checked={form.is_reserved}
            onChange={(e) => setForm({...form, is_reserved: e.target.checked})}
            className="mr-2"
          />
          <label htmlFor="is_reserved" className="text-sm text-gray-700">
            예약 계정으로 생성
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {loading ? '가입 중...' : '회원가입'}
        </button>
      </form>
    </div>
  );
};
```

## 인증 훅

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  is_reserved: boolean;
  created_at: string;
  project_id?: string;
  data?: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  signup: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Axios 기본 설정
  axios.defaults.withCredentials = true;
  axios.defaults.baseURL = 'https://api.aiapp.link';

  // 401 에러 인터셉터
  axios.interceptors.response.use(
    response => response,
    async err => {
      if (err.response?.status === 401) {
        setUser(null);
      }
      return Promise.reject(err);
    }
  );

  const fetchUser = async () => {
    try {
      const response = await axios.get('/account/info');
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      setUser(null);
    }
  };

  const login = async (credentials: any) => {
    const response = await axios.post('/account/login', credentials);
    if (response.data.success) {
      await fetchUser();
    }
  };

  const signup = async (data: any) => {
    const response = await axios.post('/account/signup', data);
    return response.data;
  };

  const logout = async () => {
    try {
      // await axios.post('/logout'); // 로그아웃 API 있는 경우
    } finally {
      setUser(null);
      window.location.href = '/account/login';
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  useEffect(() => {
    fetchUser().finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      signup, 
      refreshUser 
    }}>
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

## 사용 예시

```tsx
import React from 'react';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { LoginForm } from './auth/LoginForm';
import { SignupForm } from './auth/SignupForm';

const LoginPage = () => {
  const PROJECT_ID = "[PROJECT_ID]"; // 프로젝트별 고유 ID

  const handleLoginSuccess = (userData: any) => {
    console.log('로그인 성공:', userData);
    window.location.href = '/dashboard';
  };

  return (
    <div>
      <LoginForm
        onSuccess={handleLoginSuccess}
        projectId={PROJECT_ID}
      />
    </div>
  );
};

const SignupPage = () => {
  const PROJECT_ID = "[PROJECT_ID]"; // 프로젝트별 고유 ID

  const handleSignupSuccess = (userData: any) => {
    console.log('회원가입 성공:', userData);
    alert('회원가입이 완료되었습니다. 로그인해주세요.');
    window.location.href = '/account/login';
  };

  return (
    <div>
      <SignupForm
        onSuccess={handleSignupSuccess}
        customFields={['age', 'department']}
        projectId={PROJECT_ID}
      />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <div className="App">
        {/* 라우팅에 따라 LoginPage 또는 SignupPage 렌더링 */}
      </div>
    </AuthProvider>
  );
};

export default App;
```

## 관련 문서

- [Vue 인증 컴포넌트](../vue/auth-components.md)
- [Next.js 인증 미들웨어](../nextjs/auth-middleware.md)
- [쿠키 설정 가이드](../../security/cookies.md)
- [에러 처리 가이드](../../dev/error-handling.md)