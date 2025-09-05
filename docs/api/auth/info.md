# 사용자 정보 조회 API

AIApp BaaS 인증 시스템의 사용자 정보 조회 API 명세서입니다.

## 기본 정보

- **URL**: `/info`
- **Method**: `GET`
- **Authorization**: Bearer Token 또는 Cookie 인증 필요
- **Description**: 현재 로그인한 사용자의 정보를 조회합니다. JWT 토큰에 포함된 project_id를 기반으로 해당 프로젝트의 사용자 정보만 반환됩니다.

## 요청

### Headers

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

또는 쿠키를 통한 자동 인증 (withCredentials: true 설정)

### 요청 예시

```javascript
// Bearer Token 방식
fetch('https://api.aiapp.link/info', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Cookie 방식
fetch('https://api.aiapp.link/info', {
  method: 'GET',
  credentials: 'include'
});
```

## 응답 스키마

### 성공 응답 (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "user-uuid-here",
    "user_id": "johndoe",
    "name": "John Doe",
    "phone": "010-1234-5678",
    "is_reserved": false,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T15:45:00Z",
    "project_id": "[PROJECT_ID]",
    "data": {
      "age": 25,
      "department": "Engineering",
      "interests": ["coding", "ai"]
    }
  }
}
```

### 에러 응답

#### 401 Unauthorized (토큰 없음/만료)
```json
{
  "success": false,
  "message": "인증이 필요합니다.",
  "error_code": "AUTHENTICATION_REQUIRED"
}
```

#### 403 Forbidden (유효하지 않은 토큰)
```json
{
  "success": false,
  "message": "유효하지 않은 토큰입니다.",
  "error_code": "INVALID_TOKEN"
}
```

## 구현 예제

### JavaScript/Fetch

```javascript
const getUserInfo = async (token) => {
  try {
    const response = await fetch('https://api.aiapp.link/info', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // 토큰 만료 또는 인증 실패
        window.location.href = '/login';
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
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
import axios from 'axios';

interface User {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  is_reserved: boolean;
  created_at: string;
  updated_at: string;
  project_id?: string;
  data?: Record<string, any>;
}

export const useUserInfo = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/info', {
        withCredentials: true // 쿠키 인증 사용
      });
      
      setUser(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('인증이 만료되었습니다. 다시 로그인해주세요.');
        // 로그인 페이지로 리디렉션
        window.location.href = '/login';
      } else {
        setError('사용자 정보를 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return { user, loading, error, refetch: fetchUserInfo };
};
```

### Vue Composable

```typescript
import { ref, onMounted } from 'vue';
import axios from 'axios';

export const useUserInfo = () => {
  const user = ref(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  const fetchUserInfo = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get('/info', {
        withCredentials: true
      });
      
      user.value = response.data.data;
    } catch (err: any) {
      if (err.response?.status === 401) {
        error.value = '인증이 만료되었습니다. 다시 로그인해주세요.';
        // 로그인 페이지로 리디렉션
        window.location.href = '/login';
      } else {
        error.value = '사용자 정보를 불러오는데 실패했습니다.';
      }
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchUserInfo();
  });

  return { user, loading, error, refetch: fetchUserInfo };
};
```

## Axios 인터셉터 설정

자동 토큰 관리 및 에러 처리를 위한 인터셉터:

```typescript
import axios from 'axios';

// 요청 인터셉터 - 토큰 자동 첨부
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 - 토큰 만료 처리
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 로그인 페이지로 리디렉션
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Next.js 미들웨어

API 라우트 보호를 위한 미들웨어:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // JWT 토큰 검증 로직 (선택사항)
  try {
    // verify token here
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/admin/:path*']
};
```

## 인증 상태 관리

### React Context

```typescript
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await axios.get('/info', {
        withCredentials: true
      });
      setUser(response.data.data);
    } catch (error) {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await axios.post('/login', credentials, {
      withCredentials: true
    });
    await refreshUser();
  };

  const logout = () => {
    setUser(null);
    // 로그아웃 API 호출 (선택사항)
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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

## 보안 고려사항

1. **토큰 저장**: localStorage보다는 HttpOnly 쿠키 사용 권장
2. **토큰 만료**: 적절한 토큰 만료 시간 설정 및 갱신 로직
3. **인증 실패 처리**: 401/403 에러 시 자동 로그아웃 및 로그인 페이지 리디렉션
4. **민감 정보**: 응답에서 민감한 정보(비밀번호 해시 등) 제외
5. **Rate Limiting**: API 호출 빈도 제한으로 남용 방지

## 관련 문서

- [로그인 API](../login.md)
- [회원가입 API](../signup.md)
- [JWT 토큰 관리](../../security/jwt.md)
- [쿠키 설정 가이드](../../security/cookies.md)
- [인증 미들웨어](../../templates/nextjs/auth-middleware.md)