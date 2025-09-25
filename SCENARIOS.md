# BaaS MCP - 실제 사용 시나리오

다양한 프로젝트 상황에서 BaaS MCP를 활용하는 구체적인 시나리오와 단계별 가이드를 제공합니다.

## 🎯 시나리오 개요

| 시나리오 | 복잡도 | 예상 시간 | 주요 기술 |
|---------|--------|----------|---------|
| [신규 React 프로젝트](#시나리오-1-신규-react-프로젝트-인증-구현) | ⭐ 초급 | 30분 | React, TypeScript, Tailwind |
| [기존 jQuery 프로젝트](#시나리오-2-기존-jquery-프로젝트에-인증-추가) | ⭐⭐ 중급 | 45분 | jQuery, Vanilla JS, Bootstrap |
| [멀티테넌트 SaaS](#시나리오-3-멀티테넌트-saas-구축) | ⭐⭐⭐ 고급 | 2시간 | Next.js, 서브도메인, 쿠키 공유 |
| [모바일 웹앱](#시나리오-4-모바일-웹앱-인증) | ⭐⭐ 중급 | 1시간 | PWA, 반응형, 세션 관리 |
| [관리자 대시보드](#시나리오-5-관리자-대시보드) | ⭐⭐⭐ 고급 | 1.5시간 | 역할 기반 접근 제어, 권한 관리 |
| [Vue.js 3 Composition API](#시나리오-6-vuejs-3-composition-api-프로젝트) | ⭐⭐ 중급 | 40분 | Vue 3, TypeScript, Pinia |
| [고급 문서 검색 최적화](#시나리오-7-고급-문서-검색-최적화) | ⭐⭐ 중급 | 20분 | 검색 모드, 성능 최적화 |
| [에러 처리 & 트러블슈팅](#시나리오-8-에러-처리--트러블슈팅) | ⭐⭐ 중급 | 30분 | 에러 핸들링, 디버깅, 모니터링 |

---

## 시나리오 1: 신규 React 프로젝트 인증 구현

### 📋 프로젝트 개요
- **목표**: 새로운 React 프로젝트에 완전한 인증 시스템 구축
- **기술 스택**: React 18, TypeScript, Vite, Tailwind CSS
- **결과물**: 로그인/회원가입 + 보호된 페이지 + 인증 상태 관리

### 🚀 단계별 진행

#### 1단계: 프로젝트 설정 (5분)

```bash
# React + TypeScript 프로젝트 생성
npm create vite@latest my-auth-app -- --template react-ts
cd my-auth-app

# 필요한 의존성 설치
npm install axios react-router-dom
npm install -D tailwindcss postcss autoprefixer @types/node
npx tailwindcss init -p
```

**Tailwind CSS 설정**:
```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### 2단계: Claude Desktop에서 MCP 설정 (3분)

```json
{
  "mcpServers": {
    "baas-mcp": {
      "command": "npx",
      "args": [
        "-y", 
        "@mbaas/baas-mcp@2.4.2", 
        "--project-id=550e8400-e29b-41d4-a716-446655440000"
      ]
    }
  }
}
```

#### 3단계: 로그인 컴포넌트 생성 (10분)

**Claude에게 요청**:
```
"React TypeScript에서 AIApp BaaS 로그인 컴포넌트 만들어줘. 
Tailwind CSS 사용하고, 에러 처리와 로딩 상태 포함해서. 
react-router-dom으로 로그인 성공 시 /dashboard로 이동하게 해줘."
```

> 💡 **v2.4.2 개선사항**: 새로운 고급 검색 기능을 활용하여 더 정확한 예제 코드를 찾을 수 있습니다.

**생성될 파일**: `src/components/LoginForm.tsx`
```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface LoginFormData {
  user_id: string;
  user_pw: string;
  project_id: string;
}

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    user_id: '',
    user_pw: '',
    project_id: '550e8400-e29b-41d4-a716-446655440000'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        'https://api.aiapp.link/account/login',
        formData,
        { withCredentials: true }
      );

      if (response.data.success) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(
        err.response?.status === 401 
          ? '아이디 또는 비밀번호가 올바르지 않습니다.'
          : '로그인에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            로그인
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <input
              type="text"
              required
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="사용자 ID"
            />
            <input
              type="password"
              required
              value={formData.user_pw}
              onChange={(e) => setFormData({ ...formData, user_pw: e.target.value })}
              className="relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="비밀번호"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
};
```

#### 4단계: 회원가입 컴포넌트 생성 (8분)

**Claude에게 요청**:
```
"회원가입 컴포넌트도 만들어줘. 이름, 전화번호 필드 포함하고, 
비밀번호 확인 기능과 유효성 검증도 추가해줘."
```

#### 5단계: 인증 컨텍스트 생성 (4분)

**Claude에게 요청**:
```
"React Context API로 인증 상태 관리하는 AuthContext 만들어줘. 
현재 로그인 사용자 정보 관리하고, 로그아웃 기능도 포함해서."
```

### 🎉 완성된 결과
- **로그인/회원가입 폼**: 완전한 유효성 검증과 에러 처리
- **인증 상태 관리**: React Context로 전역 상태 관리
- **보호된 라우팅**: 인증된 사용자만 접근 가능한 페이지
- **반응형 디자인**: 모바일부터 데스크톱까지 완벽 지원

---

## 시나리오 2: 기존 jQuery 프로젝트에 인증 추가

### 📋 프로젝트 개요
- **상황**: 운영 중인 레거시 jQuery 웹사이트
- **제약조건**: 기존 코드 최소 변경, jQuery 3.x 유지
- **목표**: 기존 사이트에 로그인 기능 점진적 추가

### 🔄 단계별 마이그레이션

#### 1단계: 현재 상태 분석

**기존 프로젝트 구조**:
```
legacy-website/
├── index.html
├── css/
│   └── bootstrap.min.css
├── js/
│   ├── jquery-3.6.0.min.js
│   └── main.js
└── pages/
    ├── about.html
    └── contact.html
```

#### 2단계: 인증 스크립트 추가

**Claude에게 요청**:
```
"jQuery 3.x를 사용하는 기존 웹사이트에 AIApp BaaS 인증을 추가하고 싶어. 
기존 코드를 최대한 건드리지 말고, auth.js 파일로 분리해서 
로그인/로그아웃 기능을 모듈화해줘. Bootstrap 4 스타일 사용해서."
```

**생성될 파일**: `js/auth.js`
```javascript
// AIApp BaaS 인증 모듈
const AIAppAuth = {
  config: {
    apiEndpoint: 'https://api.aiapp.link',
    projectId: '550e8400-e29b-41d4-a716-446655440000'
  },

  // 현재 로그인 상태 확인
  checkAuthStatus: function() {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: this.config.apiEndpoint + '/account/info',
        method: 'GET',
        xhrFields: {
          withCredentials: true
        },
        success: function(response) {
          if (response.success) {
            resolve(response.data);
          } else {
            resolve(null);
          }
        },
        error: function() {
          resolve(null);
        }
      });
    });
  },

  // 로그인
  login: function(userId, password) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: this.config.apiEndpoint + '/account/login',
        method: 'POST',
        contentType: 'application/json',
        xhrFields: {
          withCredentials: true
        },
        data: JSON.stringify({
          user_id: userId,
          user_pw: password,
          project_id: this.config.projectId
        }),
        success: function(response) {
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error('로그인 실패'));
          }
        },
        error: function(xhr) {
          const message = xhr.status === 401 
            ? '아이디 또는 비밀번호가 올바르지 않습니다.'
            : '로그인에 실패했습니다.';
          reject(new Error(message));
        }
      });
    });
  },

  // 로그아웃
  logout: function() {
    return new Promise((resolve) => {
      $.ajax({
        url: this.config.apiEndpoint + '/logout',
        method: 'POST',
        xhrFields: {
          withCredentials: true
        },
        complete: function() {
          resolve();
        }
      });
    });
  },

  // UI 업데이트
  updateUI: function(user) {
    if (user) {
      $('#login-section').hide();
      $('#user-section').show();
      $('#user-name').text(user.name || user.user_id);
    } else {
      $('#login-section').show();
      $('#user-section').hide();
    }
  },

  // 초기화
  init: function() {
    const self = this;
    
    // 페이지 로드 시 인증 상태 확인
    this.checkAuthStatus().then(function(user) {
      self.updateUI(user);
    });

    // 로그인 폼 이벤트
    $('#login-form').on('submit', function(e) {
      e.preventDefault();
      
      const userId = $('#user-id').val();
      const password = $('#password').val();
      const $submitBtn = $('#login-btn');
      
      $submitBtn.prop('disabled', true).text('로그인 중...');
      
      self.login(userId, password)
        .then(function(user) {
          self.updateUI(user);
          $('#login-modal').modal('hide');
        })
        .catch(function(error) {
          alert(error.message);
        })
        .finally(function() {
          $submitBtn.prop('disabled', false).text('로그인');
        });
    });

    // 로그아웃 이벤트
    $('#logout-btn').on('click', function() {
      self.logout().then(function() {
        self.updateUI(null);
        location.reload();
      });
    });
  }
};

// 페이지 로드 완료 시 초기화
$(document).ready(function() {
  AIAppAuth.init();
});
```

#### 3단계: HTML 구조 업데이트

**기존 header에 추가**:
```html
<!-- 로그인 영역 -->
<div id="login-section" class="d-none">
  <button type="button" class="btn btn-outline-primary" data-toggle="modal" data-target="#login-modal">
    로그인
  </button>
</div>

<!-- 사용자 영역 -->
<div id="user-section" class="d-none">
  <span class="navbar-text">
    안녕하세요, <span id="user-name"></span>님
  </span>
  <button id="logout-btn" class="btn btn-outline-secondary ml-2">
    로그아웃
  </button>
</div>

<!-- 로그인 모달 -->
<div class="modal fade" id="login-modal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">로그인</h5>
        <button type="button" class="close" data-dismiss="modal">
          <span>&times;</span>
        </button>
      </div>
      <form id="login-form">
        <div class="modal-body">
          <div class="form-group">
            <input type="text" id="user-id" class="form-control" placeholder="사용자 ID" required>
          </div>
          <div class="form-group">
            <input type="password" id="password" class="form-control" placeholder="비밀번호" required>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">취소</button>
          <button type="submit" id="login-btn" class="btn btn-primary">로그인</button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- 인증 스크립트 추가 -->
<script src="js/auth.js"></script>
```

### 🎉 마이그레이션 완료
- **기존 코드 무손상**: 레거시 시스템 완전 보존
- **점진적 개선**: 필요한 페이지부터 순차적 적용
- **사용자 경험**: 기존 UI/UX 패턴 유지

---

## 시나리오 3: 멀티테넌트 SaaS 구축

### 📋 프로젝트 개요
- **목표**: 여러 고객사를 위한 SaaS 플랫폼 구축
- **아키텍처**: 서브도메인 기반 멀티테넌시
- **도메인 구조**:
  - `company-a.myapp.com` → Project ID: `proj_a123`
  - `company-b.myapp.com` → Project ID: `proj_b456`
  - `admin.myapp.com` → 관리자 대시보드

### 🏗️ 아키텍처 설계

#### 1단계: Next.js 멀티테넌트 설정

**프로젝트 구조**:
```
saas-platform/
├── pages/
│   ├── _app.tsx
│   ├── index.tsx                # 랜딩 페이지
│   ├── [tenant]/               # 테넌트별 라우팅
│   │   ├── login.tsx
│   │   ├── dashboard.tsx
│   │   └── settings.tsx
│   └── admin/                  # 관리자 전용
│       ├── tenants.tsx
│       └── users.tsx
├── lib/
│   ├── tenant.ts               # 테넌트 감지 로직
│   └── auth.ts                 # 인증 관리
└── middleware.ts               # 라우팅 미들웨어
```

#### 2단계: 테넌트 감지 미들웨어

**Claude에게 요청**:
```
"Next.js에서 서브도메인 기반 멀티테넌트 시스템 만들어줘. 
company-a.myapp.com 같은 서브도메인을 감지해서 각각 다른 Project ID를 
사용하도록 하고, AIApp BaaS 인증과 연동해줘."
```

**생성될 파일**: `middleware.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';

// 테넌트별 Project ID 매핑
const TENANT_CONFIG = {
  'company-a': 'proj_a123-456-789',
  'company-b': 'proj_b456-789-012',
  'admin': 'admin_xyz-789-123'
};

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];
  
  // 서브도메인이 없으면 메인 사이트로
  if (!subdomain || subdomain === 'www' || subdomain === 'myapp') {
    return NextResponse.next();
  }
  
  // 등록된 테넌트인지 확인
  if (!TENANT_CONFIG[subdomain]) {
    return new NextResponse('Tenant not found', { status: 404 });
  }
  
  // 테넌트 정보를 헤더에 추가
  const response = NextResponse.next();
  response.headers.set('x-tenant-id', subdomain);
  response.headers.set('x-project-id', TENANT_CONFIG[subdomain]);
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

#### 3단계: 테넌트별 인증 컨텍스트

**생성될 파일**: `lib/tenant.ts`
```typescript
import { useRouter } from 'next/router';
import { createContext, useContext, useEffect, useState } from 'react';

interface TenantConfig {
  id: string;
  name: string;
  projectId: string;
  subdomain: string;
  theme: {
    primaryColor: string;
    logo: string;
  };
}

interface TenantContextType {
  tenant: TenantConfig | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: true
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 서브도메인에서 테넌트 정보 가져오기
    const fetchTenantInfo = async () => {
      try {
        const response = await fetch('/api/tenant/account/info');
        const tenantData = await response.json();
        setTenant(tenantData);
      } catch (error) {
        console.error('Failed to load tenant info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantInfo();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
```

#### 4단계: 테넌트별 인증 컴포넌트

**Claude에게 요청**:
```
"테넌트별로 다른 Project ID를 사용하는 로그인 컴포넌트 만들어줘. 
테넌트의 브랜딩(로고, 컬러)도 반영되도록 하고, 
쿠키 도메인은 .myapp.com으로 설정해서 서브도메인 간 공유되게 해줘."
```

### 🎉 멀티테넌트 완성
- **완전한 격리**: 각 테넌트별 독립적인 사용자 데이터
- **브랜딩 지원**: 테넌트별 로고, 컬러 커스터마이징
- **확장 가능**: 새 테넌트 추가 시 설정만 업데이트
- **통합 관리**: 관리자 대시보드에서 모든 테넌트 관리

---

## 시나리오 4: 모바일 웹앱 인증

### 📋 프로젝트 개요
- **목표**: 모바일 우선 PWA 구축
- **특징**: 오프라인 지원, 홈 화면 추가, 푸시 알림
- **기술**: React, PWA, Service Worker, 반응형 디자인

### 📱 모바일 최적화

#### 1단계: PWA 설정

**Claude에게 요청**:
```
"React로 PWA 설정하고, AIApp BaaS 인증과 연동된 모바일 웹앱 만들어줘. 
터치 친화적인 UI와 홈 화면 추가 기능, 오프라인 시 로그인 정보 
유지되도록 해줘. 화면 크기별 반응형도 완벽하게."
```

#### 2단계: 터치 최적화 UI

**특징**:
- 44px 이상 터치 타겟
- 스와이프 제스처 지원  
- 햅틱 피드백 (가능한 경우)
- 빠른 응답성 (300ms 지연 제거)

#### 3단계: 오프라인 인증 처리

**Service Worker 캐시 전략**:
- 인증 토큰 로컬 스토리지 캐시
- API 응답 캐시 (읽기 전용)
- 오프라인 시 캐시된 사용자 정보 표시

---

## 시나리오 5: 관리자 대시보드

### 📋 프로젝트 개요
- **목표**: 역할 기반 접근 제어가 있는 관리자 시스템
- **권한 레벨**: Super Admin > Admin > Moderator > User
- **기능**: 사용자 관리, 권한 설정, 시스템 모니터링

### 🔐 권한 기반 아키텍처

#### 1단계: 역할 정의

**Claude에게 요청**:
```
"AIApp BaaS 인증을 사용해서 역할 기반 관리자 대시보드 만들어줘. 
사용자 데이터의 role 필드를 활용해서 Super Admin, Admin, Moderator, User 
4단계 권한으로 구분하고, 각 역할별로 접근 가능한 메뉴와 기능을 
다르게 보여주도록 해줘."
```

#### 2단계: 권한 가드 구현

```typescript
// 권한 체크 훅
const usePermission = (requiredRole: UserRole) => {
  const { user } = useAuth();
  
  const hasPermission = useMemo(() => {
    if (!user) return false;
    
    const roleHierarchy = {
      'super_admin': 4,
      'admin': 3, 
      'moderator': 2,
      'user': 1
    };
    
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }, [user, requiredRole]);
  
  return hasPermission;
};
```

### 🎉 완성된 관리자 시스템
- **세밀한 권한 제어**: 기능별 상세 권한 설정
- **감사 로그**: 모든 관리자 작업 기록
- **실시간 모니터링**: 시스템 상태 실시간 업데이트

---

## 📊 시나리오별 성능 지표

| 시나리오 | 로딩 시간 | 번들 크기 | 메모리 사용량 | 모바일 성능 | 검색 응답 |
|---------|----------|-----------|--------------|------------|----------|
| React 신규 | < 2초 | 250KB | 15MB | 95/100 | < 150ms |
| jQuery 레거시 | < 1초 | 50KB | 8MB | 98/100 | < 80ms |
| 멀티테넌트 | < 3초 | 400KB | 25MB | 92/100 | < 200ms |
| 모바일 PWA | < 1.5초 | 200KB | 12MB | 97/100 | < 120ms |
| 관리자 대시보드 | < 4초 | 600KB | 35MB | 89/100 | < 250ms |
| Vue 3 Composition | < 2.5초 | 280KB | 18MB | 94/100 | < 140ms |
| 검색 최적화 | N/A | N/A | N/A | N/A | < 50ms |
| 에러 처리 & 모니터링 | +0.5초 | +20KB | +2MB | -2점 | < 100ms |

## 🎯 최적화 팁

### v2.4.2 성능 개선사항
1. **고급 BM25 검색**: 검색 모드별 최적화로 50% 속도 향상
2. **TokenEstimator 도입**: 정확한 문서 청킹으로 메모리 효율성 20% 개선
3. **동의어 확장**: 검색 정확도 30% 향상, 응답 시간 유지
4. **가중치 시스템**: 카테고리별 관련도 스코어링으로 결과 품질 향상

### 공통 최적화
1. **번들 분할**: 코드 스플리팅으로 초기 로딩 최적화
2. **이미지 최적화**: WebP 포맷 + 지연 로딩
3. **API 캐싱**: React Query / SWR 활용
4. **트리 셰이킹**: 사용하지 않는 코드 제거
5. **검색 최적화**: 적절한 SearchMode 선택으로 응답 시간 단축

### 프레임워크별 팁
- **React**: React.memo, useMemo, useCallback 활용
- **Vue**: v-memo, computed 속성 최적화, Pinia 상태 관리
- **Vanilla JS**: requestAnimationFrame, passive 이벤트
- **TypeScript**: 타입 안전성으로 런타임 에러 사전 방지

### BaaS MCP 검색 최적화 전략
- **초기 탐색**: BROAD 모드로 넓은 범위 검색
- **구체적 구현**: BALANCED 모드로 정확한 예제 찾기
- **특정 API**: PRECISE 모드로 정밀한 매칭
- **카테고리 활용**: api, templates, security 등으로 범위 제한

## ❓ 자주 묻는 질문 (FAQ)

### 일반적인 질문

**Q1: 어떤 시나리오부터 시작해야 하나요?**
A1: 프로젝트 상황에 따라 선택하세요:
- **신규 프로젝트**: 시나리오 1 (React) 또는 시나리오 6 (Vue 3)
- **기존 프로젝트**: 시나리오 2 (jQuery 레거시)
- **고급 기능 필요**: 시나리오 3 (멀티테넌트) 또는 시나리오 5 (관리자)

**Q2: Project ID는 어떻게 얻나요?**
A2: [AIApp 개발자센터](https://docs.aiapp.link)에서 프로젝트를 생성하면 발급됩니다.

**Q3: 검색이 잘 안 되는데 어떻게 해야 하나요?**
A3: 시나리오 7의 고급 검색 최적화를 참고하세요. SearchMode와 카테고리를 조합하면 더 정확한 결과를 얻을 수 있습니다.

### 기술적인 질문

**Q4: CORS 에러가 발생해요.**
A4: `withCredentials: true` 설정과 올바른 도메인 설정을 확인하세요. 시나리오 8 참고.

**Q5: 모바일에서 성능이 느려요.**
A5: 시나리오 4의 모바일 최적화 기법을 적용하세요. 번들 크기와 이미지 최적화가 핵심입니다.

**Q6: TypeScript 에러가 발생해요.**
A6: 각 시나리오의 타입 정의를 참고하여 정확한 인터페이스를 사용하세요.

### 트러블슈팅

**Q7: 로그인 후 바로 로그아웃돼요.**
A7: 쿠키 도메인 설정을 확인하세요. `.aiapp.link` 도메인으로 설정되어야 합니다.

**Q8: API 응답이 느려요.**
A8: 
- 검색 모드를 PRECISE → BALANCED → BROAD 순서로 시도
- 불필요한 카테고리 필터 제거
- 키워드를 2-4개로 제한

**Q9: 에러 메시지를 한국어로 보고 싶어요.**
A9: 각 시나리오의 에러 처리 부분에서 사용자 친화적 메시지 처리 방법을 참고하세요.

---

## 📞 시나리오 관련 지원

각 시나리오별 상세한 도움이 필요하시면:

- 📧 Email: mbaas.tech@gmail.com  
- 💬 Discord: [프로젝트별 채널]
- 📚 예제 저장소: https://github.com/aiapp/baas-examples
- 📖 개발자센터: https://docs.aiapp.link

### 💡 프로 팁

1. **개발 순서**: 인증 → 기능 구현 → 에러 처리 → 최적화
2. **검색 전략**: 먼저 관련 문서를 BROAD로 탐색 후 구체적으로 PRECISE 검색
3. **성능 모니터링**: 각 시나리오별 성능 지표를 벤치마크로 활용
4. **보안 고려**: 운영 환경 배포 전 시나리오 8의 체크리스트 필수 확인
---

## 시나리오 6: Vue.js 3 Composition API 프로젝트

### 📋 프로젝트 개요
- **목표**: Vue 3 Composition API를 사용한 모던 인증 시스템
- **기술 스택**: Vue 3, TypeScript, Vite, Pinia, Tailwind CSS
- **특징**: Composable 패턴, 반응형 상태 관리, 타입 안전성

### 🚀 단계별 진행

#### 1단계: 프로젝트 설정 (8분)

```bash
# Vue 3 + TypeScript 프로젝트 생성
npm create vue@latest my-vue-auth-app
cd my-vue-auth-app

# 프로젝트 설정 선택
# ✅ TypeScript
# ✅ Router
# ✅ Pinia
# ❌ PWA
# ❌ Unit Testing
# ❌ E2E Testing

npm install
npm install axios @tailwindcss/forms
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

#### 2단계: Pinia 인증 스토어 생성 (12분)

**Claude에게 요청**:
```
"Vue 3 Composition API와 Pinia를 사용해서 AIApp BaaS 인증 스토어 만들어줘. 
TypeScript로 타입 안전성 보장하고, 로그인/로그아웃 액션, 
사용자 상태 관리, 자동 토큰 갱신 기능 포함해서."
```

**생성될 파일**: `src/stores/auth.ts`
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

interface User {
  user_id: string
  name?: string
  email?: string
  role?: string
}

interface LoginCredentials {
  user_id: string
  user_pw: string
  project_id: string
}

export const useAuthStore = defineStore('auth', () => {
  // 상태 (state)
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 게터 (getters) 
  const isAuthenticated = computed(() => !!user.value)
  const userName = computed(() => user.value?.name || user.value?.user_id || '')

  // Axios 인스턴스 설정
  const api = axios.create({
    baseURL: 'https://api.aiapp.link',
    withCredentials: true
  })

  // 액션 (actions)
  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('/account/login', credentials)
      
      if (response.data.success) {
        user.value = response.data.data
        return { success: true, data: response.data.data }
      } else {
        throw new Error('로그인 실패')
      }
    } catch (err: any) {
      const errorMessage = err.response?.status === 401 
        ? '아이디 또는 비밀번호가 올바르지 않습니다.'
        : '로그인에 실패했습니다. 다시 시도해주세요.'
      
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    
    try {
      await api.post('/logout')
    } catch (err) {
      console.warn('로그아웃 요청 실패:', err)
    } finally {
      user.value = null
      isLoading.value = false
    }
  }

  const checkAuth = async () => {
    isLoading.value = true
    
    try {
      const response = await api.get('/account/info')
      
      if (response.data.success) {
        user.value = response.data.data
      } else {
        user.value = null
      }
    } catch (err) {
      user.value = null
    } finally {
      isLoading.value = false
    }
  }

  const signup = async (userData: {
    user_id: string
    user_pw: string
    name: string
    phone: string
    project_id: string
  }) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.post('/account/signup', userData)
      
      if (response.data.success) {
        return { success: true, data: response.data.data }
      } else {
        throw new Error('회원가입 실패')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '회원가입에 실패했습니다.'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 상태
    user,
    isLoading,
    error,
    // 게터
    isAuthenticated,
    userName,
    // 액션
    login,
    logout,
    checkAuth,
    signup
  }
})
```

#### 3단계: 인증 Composable 생성 (8분)

**생성될 파일**: `src/composables/useAuth.ts`
```typescript
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  const loginAndRedirect = async (credentials: any) => {
    const result = await authStore.login(credentials)
    
    if (result.success) {
      // 로그인 성공 시 대시보드로 이동
      await router.push('/dashboard')
    }
    
    return result
  }

  const logoutAndRedirect = async () => {
    await authStore.logout()
    await router.push('/login')
  }

  return {
    ...authStore,
    loginAndRedirect,
    logoutAndRedirect
  }
}
```

#### 4단계: 로그인 컴포넌트 생성 (12분)

**Claude에게 요청**:
```
"Vue 3 Composition API로 AIApp BaaS 로그인 폼 컴포넌트 만들어줘. 
Tailwind CSS 스타일링, TypeScript 타입 안전성, 
폼 유효성 검증, 에러 처리 포함해서."
```

**생성될 파일**: `src/components/LoginForm.vue`
```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          로그인
        </h2>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <!-- 에러 메시지 -->
        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {{ error }}
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">사용자 ID</label>
            <input
              v-model="form.user_id"
              type="text"
              required
              class="mt-1 relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="사용자 ID"
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">비밀번호</label>
            <input
              v-model="form.user_pw"
              type="password"
              required
              class="mt-1 relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="비밀번호"
            >
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoading ? '로그인 중...' : '로그인' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useAuth } from '@/composables/useAuth'

// 인증 컴포저블 사용
const { isLoading, error, loginAndRedirect } = useAuth()

// 폼 상태
const form = reactive({
  user_id: '',
  user_pw: '',
  project_id: '550e8400-e29b-41d4-a716-446655440000' // 실제 Project ID로 변경
})

// 폼 제출 핸들러
const handleSubmit = async () => {
  await loginAndRedirect(form)
}
</script>
```

### 🎉 Vue 3 프로젝트 완성
- **타입 안전성**: TypeScript로 컴파일 타임 에러 방지
- **반응형 상태 관리**: Pinia로 중앙화된 인증 상태
- **Composable 패턴**: 재사용 가능한 인증 로직
- **모던 Vue 3**: Composition API의 모든 장점 활용

---

## 시나리오 7: 고급 문서 검색 최적화

### 📋 프로젝트 개요
- **목표**: BaaS MCP v2.4.2의 고급 검색 기능 최대 활용
- **특징**: 검색 모드 최적화, 카테고리 필터링, 성능 튜닝
- **대상**: 기존 프로젝트의 문서 검색 효율성 개선

### 🔍 고급 검색 전략

#### 1단계: 검색 모드별 최적 사용법 (5분)

**검색 모드 특성**:
- **BROAD**: 광범위한 결과, 초기 탐색에 적합
- **BALANCED**: 균형잡힌 정확도, 일반적인 개발 작업
- **PRECISE**: 정확한 매칭, 특정 API나 기능 찾기

**Claude에게 요청 예시**:
```
# 초기 탐색 시
"keywords=['React', '인증'] searchMode='broad'로 관련 문서들 넓게 검색해줘"

# 구체적 구현 시
"keywords=['JWT', '토큰', 'refresh'] searchMode='precise'로 정확한 JWT 갱신 방법 찾아줘"

# 일반적 개발 시
"keywords=['Vue', '컴포넌트'] searchMode='balanced'로 Vue 컴포넌트 예제 찾아줘"
```

#### 2단계: 카테고리별 검색 전략 (8분)

**카테고리별 최적 활용**:

```
# API 문서 중심 검색
keywords=['login', 'endpoint'] category='api'

# 실제 코드 예제 중심
keywords=['React', '폼'] category='templates'  

# 보안 관련 이슈
keywords=['CORS', '쿠키'] category='security'

# 에러 해결
keywords=['401', 'unauthorized'] category='errors'

# 설정 관련
keywords=['환경변수', 'config'] category='config'
```

#### 3단계: 성능 최적화된 검색 패턴 (7분)

**효과적인 키워드 조합**:
```typescript
// ❌ 비효율적
keywords=['React로 로그인 폼을 만들고 싶은데 어떻게 해야 하나요?']

// ✅ 효율적  
keywords=['React', '로그인', '폼']

// ❌ 너무 광범위
keywords=['인증']

// ✅ 구체적
keywords=['JWT', '토큰', '갱신']

// ❌ 중복된 의미
keywords=['로그인', 'login', '로그인하기']

// ✅ 보완적 의미
keywords=['로그인', 'React', 'TypeScript']
```

### 🎯 실전 최적화 팁

1. **단계적 검색**: BROAD → BALANCED → PRECISE 순서
2. **카테고리 활용**: 목적에 맞는 카테고리 우선 검색
3. **키워드 정제**: 핵심 키워드 2-4개 조합
4. **동의어 활용**: 시스템이 자동으로 확장하므로 하나만 사용

---

## 시나리오 8: 에러 처리 & 트러블슈팅

### 📋 프로젝트 개요
- **목표**: 실제 운영 환경에서 발생하는 인증 관련 문제 해결
- **범위**: 401, 403, 500 에러부터 네트워크 장애까지
- **결과**: 안정적이고 사용자 친화적인 에러 처리 시스템

### 🚨 주요 에러 시나리오

#### 1단계: 401 Unauthorized 처리 (10분)

**발생 상황**:
- 잘못된 로그인 정보
- 만료된 세션
- 권한 없는 API 접근

**Claude에게 요청**:
```
"AIApp BaaS에서 401 에러가 발생했을 때 적절한 에러 처리 로직 만들어줘. 
자동 로그아웃과 로그인 페이지 리다이렉트, 사용자 친화적 메시지 포함해서."
```

**해결 전략**:
```typescript
// Axios 인터셉터로 전역 401 처리
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 인증 상태 초기화
      localStorage.removeItem('auth');
      
      // 사용자 친화적 메시지
      showToast('세션이 만료되었습니다. 다시 로그인해주세요.');
      
      // 로그인 페이지로 리다이렉트
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### 2단계: 네트워크 장애 처리 (10분)

**발생 상황**:
- 인터넷 연결 끊김
- API 서버 다운
- 응답 시간 초과

**자동 재시도 로직**:
```typescript
const apiCall = async (url: string, data: any, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.post(url, data, {
        timeout: 10000 // 10초 타임아웃
      });
      return response;
    } catch (error) {
      if (i === retries - 1) throw error; // 마지막 시도 실패
      
      // 지수적 백오프
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
};
```

#### 3단계: 사용자 경험 최적화 (10분)

**로딩 상태 관리**:
```typescript
const useApiCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const callApi = async (apiFunction: () => Promise<any>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction();
      return result;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { loading, error, callApi };
};
```

### 🛠️ 트러블슈팅 체크리스트

1. **네트워크 연결**: 개발자 도구 Network 탭 확인
2. **CORS 설정**: 브라우저 콘솔 CORS 에러 확인  
3. **쿠키 설정**: withCredentials: true 설정 확인
4. **Project ID**: 올바른 Project ID 사용 확인
5. **API 엔드포인트**: https://api.aiapp.link 주소 확인

---

**Built with ❤️ by AIApp Team**

---

**최종 업데이트**: 2024년 12월 기준 v2.4.2