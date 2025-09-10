# BaaS MCP - 실제 사용 시나리오

다양한 프로젝트 상황에서 BaaS MCP를 활용하는 구체적인 시나리오와 단계별 가이드를 제공합니다.

## 🎯 시나리오 개요

| 시나리오 | 복잡도 | 예상 시간 | 주요 기술 |
|---------|--------|----------|---------|
| [신규 React 프로젝트](#시나리오-1-신규-react-프로젝트-인증-구현) | 초급 | 30분 | React, TypeScript, Tailwind |
| [기존 jQuery 프로젝트](#시나리오-2-기존-jquery-프로젝트에-인증-추가) | 중급 | 45분 | jQuery, Vanilla JS, Bootstrap |
| [멀티테넌트 SaaS](#시나리오-3-멀티테넌트-saas-구축) | 고급 | 2시간 | Next.js, 서브도메인, 쿠키 공유 |
| [모바일 웹앱](#시나리오-4-모바일-웹앱-인증) | 중급 | 1시간 | PWA, 반응형, 세션 관리 |
| [관리자 대시보드](#시나리오-5-관리자-대시보드) | 고급 | 1.5시간 | 역할 기반 접근 제어, 권한 관리 |

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
        "@mbaas/baas-mcp@latest", 
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

| 시나리오 | 로딩 시간 | 번들 크기 | 메모리 사용량 | 모바일 성능 |
|---------|----------|-----------|--------------|------------|
| React 신규 | < 2초 | 250KB | 15MB | 95/100 |
| jQuery 레거시 | < 1초 | 50KB | 8MB | 98/100 |
| 멀티테넌트 | < 3초 | 400KB | 25MB | 92/100 |
| 모바일 PWA | < 1.5초 | 200KB | 12MB | 97/100 |
| 관리자 대시보드 | < 4초 | 600KB | 35MB | 89/100 |

## 🎯 최적화 팁

### 공통 최적화
1. **번들 분할**: 코드 스플리팅으로 초기 로딩 최적화
2. **이미지 최적화**: WebP 포맷 + 지연 로딩
3. **API 캐싱**: React Query / SWR 활용
4. **트리 셰이킹**: 사용하지 않는 코드 제거

### 프레임워크별 팁
- **React**: React.memo, useMemo, useCallback 활용
- **Vue**: v-memo, computed 속성 최적화
- **Vanilla JS**: requestAnimationFrame, passive 이벤트

## 📞 시나리오 관련 지원

각 시나리오별 상세한 도움이 필요하시면:

- 📧 Email: scenarios@aiapp.link  
- 💬 Discord: [프로젝트별 채널]
- 📚 예제 저장소: https://github.com/aiapp/baas-examples
- 🎥 비디오 튜토리얼: https://youtube.com/@aiapp

---

**Built with ❤️ by AIApp Team**