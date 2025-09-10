# 순수 JavaScript 인증 상태 관리자

AIApp BaaS와 연동되는 순수 JavaScript 인증 상태 관리 시스템입니다.

## 기본 인증 관리자

### AuthManager 클래스

```javascript
// auth-manager.js
class AuthManager {
    constructor(config = {}) {
        this.config = {
            apiEndpoint: 'https://api.aiapp.link',
            projectId: config.projectId || '[PROJECT_ID]',
            storageKey: 'auth_user',
            tokenKey: 'access_token',
            checkInterval: 5 * 60 * 1000, // 5분마다 토큰 유효성 검사
            ...config
        };
        
        this.user = null;
        this.loading = false;
        this.listeners = {
            login: [],
            logout: [],
            userUpdate: [],
            error: []
        };
        
        this.init();
    }
    
    async init() {
        // 저장된 사용자 정보 복원
        this.restoreUserFromStorage();
        
        // 토큰 유효성 검사
        await this.checkAuthStatus();
        
        // 주기적 토큰 검사 시작
        this.startTokenValidation();
        
        // HTTP 요청 인터셉터 설정
        this.setupHttpInterceptor();
    }
    
    // =====================
    // 인증 상태 관리
    // =====================
    
    async checkAuthStatus() {
        if (this.loading) return this.user;
        
        this.loading = true;
        
        try {
            const response = await fetch(`${this.config.apiEndpoint}/account/info`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    this.setUser(result.data);
                    return this.user;
                }
            }
            
            // 인증 실패 시 로그아웃 처리
            this.logout(false);
            return null;
        } catch (error) {
            console.error('Auth status check failed:', error);
            this.emit('error', error);
            return null;
        } finally {
            this.loading = false;
        }
    }
    
    async login(credentials) {
        this.loading = true;
        
        try {
            const loginData = {
                user_id: credentials.user_id,
                user_pw: credentials.user_pw,
                project_id: this.config.projectId
            };
            
            const response = await fetch(`${this.config.apiEndpoint}/account/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.setUser(result.data.user);
                this.emit('login', this.user);
                return result;
            } else {
                throw new Error(result.message || '로그인에 실패했습니다.');
            }
        } catch (error) {
            this.emit('error', error);
            throw error;
        } finally {
            this.loading = false;
        }
    }
    
    async logout(callApi = true) {
        if (callApi) {
            try {
                // 서버에 로그아웃 요청 (선택사항)
                await fetch(`${this.config.apiEndpoint}/logout`, {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (error) {
                console.error('Logout API call failed:', error);
            }
        }
        
        // 로컬 상태 초기화
        this.clearUser();
        this.emit('logout');
        
        // 로그인 페이지로 리디렉션 (선택사항)
        if (this.config.redirectOnLogout !== false) {
            window.location.href = this.config.loginUrl || '/account/login';
        }
    }
    
    async refreshUser() {
        if (this.loading) return this.user;
        
        return await this.checkAuthStatus();
    }
    
    // =====================
    // 사용자 정보 관리
    // =====================
    
    setUser(userData) {
        this.user = userData;
        this.saveUserToStorage();
        this.emit('userUpdate', this.user);
    }
    
    clearUser() {
        this.user = null;
        this.removeUserFromStorage();
    }
    
    getUser() {
        return this.user;
    }
    
    isAuthenticated() {
        return !!this.user;
    }
    
    hasRole(role) {
        return this.user && this.user.roles && this.user.roles.includes(role);
    }
    
    hasPermission(permission) {
        return this.user && this.user.permissions && this.user.permissions.includes(permission);
    }
    
    // =====================
    // 로컬 스토리지 관리
    // =====================
    
    saveUserToStorage() {
        if (this.user && typeof Storage !== 'undefined') {
            try {
                localStorage.setItem(this.config.storageKey, JSON.stringify(this.user));
            } catch (error) {
                console.error('Failed to save user to storage:', error);
            }
        }
    }
    
    restoreUserFromStorage() {
        if (typeof Storage !== 'undefined') {
            try {
                const stored = localStorage.getItem(this.config.storageKey);
                if (stored) {
                    this.user = JSON.parse(stored);
                }
            } catch (error) {
                console.error('Failed to restore user from storage:', error);
                this.removeUserFromStorage();
            }
        }
    }
    
    removeUserFromStorage() {
        if (typeof Storage !== 'undefined') {
            localStorage.removeItem(this.config.storageKey);
            localStorage.removeItem(this.config.tokenKey);
        }
    }
    
    // =====================
    // 토큰 관리
    // =====================
    
    startTokenValidation() {
        if (this.config.checkInterval > 0) {
            setInterval(() => {
                if (this.isAuthenticated()) {
                    this.checkAuthStatus();
                }
            }, this.config.checkInterval);
        }
    }
    
    // =====================
    // HTTP 인터셉터
    // =====================
    
    setupHttpInterceptor() {
        // XMLHttpRequest 인터셉터
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        const self = this;
        
        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            this._url = url;
            this._method = method;
            return originalXHROpen.apply(this, arguments);
        };
        
        XMLHttpRequest.prototype.send = function(data) {
            this.addEventListener('readystatechange', function() {
                if (this.readyState === 4 && this.status === 401) {
                    if (this._url && this._url.includes(self.config.apiEndpoint)) {
                        self.handleUnauthorized();
                    }
                }
            });
            
            return originalXHRSend.apply(this, arguments);
        };
        
        // Fetch 인터셉터
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const response = await originalFetch.apply(this, args);
            
            if (response.status === 401) {
                const url = args[0];
                if (typeof url === 'string' && url.includes(self.config.apiEndpoint)) {
                    self.handleUnauthorized();
                }
            }
            
            return response;
        };
    }
    
    handleUnauthorized() {
        console.warn('Unauthorized request detected, logging out user');
        this.logout(false);
    }
    
    // =====================
    // 이벤트 시스템
    // =====================
    
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }
    
    off(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }
    
    // =====================
    // 유틸리티 메서드
    // =====================
    
    async updateProfile(profileData) {
        this.loading = true;
        
        try {
            const response = await fetch(`${this.config.apiEndpoint}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.setUser(result.data);
                return result;
            } else {
                throw new Error(result.message || '프로필 업데이트에 실패했습니다.');
            }
        } catch (error) {
            this.emit('error', error);
            throw error;
        } finally {
            this.loading = false;
        }
    }
    
    async changePassword(oldPassword, newPassword) {
        this.loading = true;
        
        try {
            const response = await fetch(`${this.config.apiEndpoint}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword
                }),
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || '비밀번호 변경에 실패했습니다.');
            }
            
            return result;
        } catch (error) {
            this.emit('error', error);
            throw error;
        } finally {
            this.loading = false;
        }
    }
}
```

## 전역 인증 관리자 설정

### 싱글톤 패턴으로 전역 관리

```javascript
// global-auth.js
(function(window) {
    'use strict';
    
    // 전역 인증 관리자 인스턴스
    let authManagerInstance = null;
    
    // 설정 초기화
    window.initAuth = function(config = {}) {
        if (authManagerInstance) {
            console.warn('Auth manager already initialized');
            return authManagerInstance;
        }
        
        authManagerInstance = new AuthManager(config);
        
        // 전역 객체에 바인딩
        window.auth = authManagerInstance;
        
        return authManagerInstance;
    };
    
    // 인증 관리자 가져오기
    window.getAuth = function() {
        if (!authManagerInstance) {
            console.warn('Auth manager not initialized. Call initAuth() first.');
            return null;
        }
        return authManagerInstance;
    };
    
})(window);
```

### HTML에서 사용하기

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>인증 데모</title>
</head>
<body>
    <div id="app">
        <div id="loginSection" style="display: none;">
            <h2>로그인이 필요합니다</h2>
            <button onclick="showLoginForm()">로그인</button>
        </div>
        
        <div id="userSection" style="display: none;">
            <h2>사용자 정보</h2>
            <div id="userInfo"></div>
            <button onclick="logout()">로그아웃</button>
        </div>
        
        <div id="loadingSection">
            <p>인증 상태 확인 중...</p>
        </div>
    </div>

    <script src="auth-manager.js"></script>
    <script src="global-auth.js"></script>
    <script>
        // 인증 관리자 초기화
        const auth = initAuth({
            projectId: '[PROJECT_ID]',
            checkInterval: 3 * 60 * 1000, // 3분마다 체크
        });
        
        // 인증 이벤트 리스너
        auth.on('login', (user) => {
            console.log('사용자 로그인:', user);
            showUserSection(user);
        });
        
        auth.on('logout', () => {
            console.log('사용자 로그아웃');
            showLoginSection();
        });
        
        auth.on('userUpdate', (user) => {
            console.log('사용자 정보 업데이트:', user);
            updateUserInfo(user);
        });
        
        auth.on('error', (error) => {
            console.error('인증 오류:', error);
            alert('인증 오류가 발생했습니다.');
        });
        
        // UI 업데이트 함수들
        function showLoginSection() {
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('userSection').style.display = 'none';
            document.getElementById('loadingSection').style.display = 'none';
        }
        
        function showUserSection(user) {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('userSection').style.display = 'block';
            document.getElementById('loadingSection').style.display = 'none';
            updateUserInfo(user);
        }
        
        function updateUserInfo(user) {
            document.getElementById('userInfo').innerHTML = `
                <p><strong>이름:</strong> ${user.name}</p>
                <p><strong>아이디:</strong> ${user.user_id}</p>
                <p><strong>전화번호:</strong> ${user.phone}</p>
                <p><strong>가입일:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
            `;
        }
        
        function showLoginForm() {
            // 로그인 폼을 모달이나 페이지로 표시
            window.location.href = '/account/login';
        }
        
        function logout() {
            auth.logout();
        }
        
        // 페이지 로드 완료 후 초기 상태 설정
        document.addEventListener('DOMContentLoaded', async () => {
            const user = await auth.checkAuthStatus();
            
            if (user) {
                showUserSection(user);
            } else {
                showLoginSection();
            }
        });
    </script>
</body>
</html>
```

## 라우팅 가드

### 페이지 접근 제한

```javascript
// route-guard.js
class RouteGuard {
    constructor(authManager, config = {}) {
        this.auth = authManager;
        this.config = {
            loginUrl: '/account/login',
            unauthorizedUrl: '/unauthorized',
            defaultUrl: '/',
            ...config
        };
        
        this.protectedRoutes = new Set();
        this.publicRoutes = new Set();
        
        this.init();
    }
    
    init() {
        // popstate 이벤트 리스너 (브라우저 뒤로가기/앞으로가기)
        window.addEventListener('popstate', (event) => {
            this.checkRoute(window.location.pathname);
        });
        
        // 초기 라우트 체크
        this.checkRoute(window.location.pathname);
    }
    
    protect(routes) {
        if (Array.isArray(routes)) {
            routes.forEach(route => this.protectedRoutes.add(route));
        } else {
            this.protectedRoutes.add(routes);
        }
    }
    
    public(routes) {
        if (Array.isArray(routes)) {
            routes.forEach(route => this.publicRoutes.add(route));
        } else {
            this.publicRoutes.add(routes);
        }
    }
    
    async checkRoute(path) {
        const isAuthenticated = this.auth.isAuthenticated();
        
        // 보호된 라우트 확인
        if (this.isProtectedRoute(path)) {
            if (!isAuthenticated) {
                // 로그인 후 현재 페이지로 돌아올 수 있도록 URL 저장
                sessionStorage.setItem('redirectAfterLogin', path);
                this.redirect(this.config.loginUrl);
                return false;
            }
        }
        
        // 퍼블릭 라우트 확인 (로그인 시 접근 제한)
        if (this.isPublicRoute(path) && isAuthenticated) {
            this.redirect(this.config.defaultUrl);
            return false;
        }
        
        return true;
    }
    
    isProtectedRoute(path) {
        return Array.from(this.protectedRoutes).some(route => {
            if (route.includes('*')) {
                const pattern = route.replace('*', '.*');
                return new RegExp(`^${pattern}$`).test(path);
            }
            return path === route || path.startsWith(route + '/');
        });
    }
    
    isPublicRoute(path) {
        return this.publicRoutes.has(path);
    }
    
    redirect(url) {
        window.location.href = url;
    }
    
    redirectAfterLogin() {
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
            sessionStorage.removeItem('redirectAfterLogin');
            this.redirect(redirectUrl);
        } else {
            this.redirect(this.config.defaultUrl);
        }
    }
}

// 사용 예제
const routeGuard = new RouteGuard(auth, {
    loginUrl: '/account/login',
    defaultUrl: '/dashboard'
});

// 보호된 라우트 설정
routeGuard.protect([
    '/dashboard',
    '/profile',
    '/admin/*'
]);

// 퍼블릭 라우트 설정 (로그인 후 접근 제한)
routeGuard.public([
    '/account/login',
    '/account/signup'
]);

// 로그인 성공 후 리디렉션
auth.on('login', () => {
    routeGuard.redirectAfterLogin();
});
```

## 권한 기반 UI 제어

### 역할 및 권한 관리

```javascript
// permission-manager.js
class PermissionManager {
    constructor(authManager) {
        this.auth = authManager;
        this.hiddenElements = new WeakMap();
        
        // 사용자 정보 업데이트 시 권한 재확인
        this.auth.on('userUpdate', () => {
            this.updateUI();
        });
        
        this.auth.on('logout', () => {
            this.updateUI();
        });
    }
    
    hasRole(role) {
        const user = this.auth.getUser();
        return user && user.roles && user.roles.includes(role);
    }
    
    hasPermission(permission) {
        const user = this.auth.getUser();
        return user && user.permissions && user.permissions.includes(permission);
    }
    
    hasAnyRole(roles) {
        return roles.some(role => this.hasRole(role));
    }
    
    hasAnyPermission(permissions) {
        return permissions.some(permission => this.hasPermission(permission));
    }
    
    showIfRole(selector, roles) {
        this.toggleElement(selector, this.hasAnyRole(Array.isArray(roles) ? roles : [roles]));
    }
    
    hideIfRole(selector, roles) {
        this.toggleElement(selector, !this.hasAnyRole(Array.isArray(roles) ? roles : [roles]));
    }
    
    showIfPermission(selector, permissions) {
        this.toggleElement(selector, this.hasAnyPermission(Array.isArray(permissions) ? permissions : [permissions]));
    }
    
    hideIfPermission(selector, permissions) {
        this.toggleElement(selector, !this.hasAnyPermission(Array.isArray(permissions) ? permissions : [permissions]));
    }
    
    toggleElement(selector, show) {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach(element => {
            if (show) {
                // 원래 display 스타일 복원
                const originalDisplay = this.hiddenElements.get(element) || 'block';
                element.style.display = originalDisplay;
                this.hiddenElements.delete(element);
            } else {
                // 현재 display 스타일 저장 후 숨기기
                if (element.style.display !== 'none') {
                    this.hiddenElements.set(element, element.style.display || 'block');
                }
                element.style.display = 'none';
            }
        });
    }
    
    updateUI() {
        // data-role 속성으로 요소 제어
        document.querySelectorAll('[data-role]').forEach(element => {
            const requiredRoles = element.getAttribute('data-role').split(',').map(r => r.trim());
            const hasRequiredRole = this.hasAnyRole(requiredRoles);
            
            if (hasRequiredRole) {
                element.style.display = this.hiddenElements.get(element) || 'block';
            } else {
                if (element.style.display !== 'none') {
                    this.hiddenElements.set(element, element.style.display || 'block');
                }
                element.style.display = 'none';
            }
        });
        
        // data-permission 속성으로 요소 제어
        document.querySelectorAll('[data-permission]').forEach(element => {
            const requiredPermissions = element.getAttribute('data-permission').split(',').map(p => p.trim());
            const hasRequiredPermission = this.hasAnyPermission(requiredPermissions);
            
            if (hasRequiredPermission) {
                element.style.display = this.hiddenElements.get(element) || 'block';
            } else {
                if (element.style.display !== 'none') {
                    this.hiddenElements.set(element, element.style.display || 'block');
                }
                element.style.display = 'none';
            }
        });
    }
}

// 사용 예제
const permissionManager = new PermissionManager(auth);

// HTML에서 사용
/*
<button data-role="admin">관리자 메뉴</button>
<div data-permission="user.edit,user.delete">사용자 편집 영역</div>
<nav data-role="admin,moderator">관리 내비게이션</nav>
*/

// JavaScript에서 사용
permissionManager.showIfRole('.admin-panel', ['admin']);
permissionManager.hideIfPermission('.user-actions', ['user.edit']);
```

## 자동 로그인 및 Remember Me

### 로그인 상태 유지

```javascript
// remember-me.js
class RememberMeManager {
    constructor(authManager) {
        this.auth = authManager;
        this.rememberKey = 'auth_remember_token';
        this.deviceKey = 'auth_device_id';
        
        this.init();
    }
    
    init() {
        // 페이지 로드 시 자동 로그인 시도
        this.tryAutoLogin();
        
        // 로그인 성공 시 Remember Me 토큰 저장
        this.auth.on('login', (user) => {
            if (this.isRememberMeEnabled()) {
                this.saveRememberToken();
            }
        });
        
        // 로그아웃 시 Remember Me 토큰 삭제
        this.auth.on('logout', () => {
            this.clearRememberToken();
        });
    }
    
    async tryAutoLogin() {
        const rememberToken = this.getRememberToken();
        
        if (rememberToken && !this.auth.isAuthenticated()) {
            try {
                const response = await fetch(`${this.auth.config.apiEndpoint}/auto-login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        remember_token: rememberToken,
                        device_id: this.getDeviceId()
                    }),
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        this.auth.setUser(result.data.user);
                        this.auth.emit('login', result.data.user);
                    }
                }
            } catch (error) {
                console.error('Auto login failed:', error);
                this.clearRememberToken();
            }
        }
    }
    
    async saveRememberToken() {
        try {
            const response = await fetch(`${this.auth.config.apiEndpoint}/remember-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    device_id: this.getDeviceId()
                }),
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data.remember_token) {
                    localStorage.setItem(this.rememberKey, result.data.remember_token);
                }
            }
        } catch (error) {
            console.error('Failed to save remember token:', error);
        }
    }
    
    getRememberToken() {
        return localStorage.getItem(this.rememberKey);
    }
    
    clearRememberToken() {
        localStorage.removeItem(this.rememberKey);
    }
    
    getDeviceId() {
        let deviceId = localStorage.getItem(this.deviceKey);
        
        if (!deviceId) {
            // 간단한 디바이스 ID 생성
            deviceId = this.generateDeviceId();
            localStorage.setItem(this.deviceKey, deviceId);
        }
        
        return deviceId;
    }
    
    generateDeviceId() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2);
        const userAgent = navigator.userAgent;
        
        // 간단한 해시 생성
        let hash = 0;
        const str = timestamp + random + userAgent;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32비트로 변환
        }
        
        return Math.abs(hash).toString(16);
    }
    
    isRememberMeEnabled() {
        // 체크박스나 설정에서 Remember Me가 활성화되었는지 확인
        const checkbox = document.getElementById('rememberMe');
        return checkbox && checkbox.checked;
    }
}

// 사용 예제
const rememberMeManager = new RememberMeManager(auth);
```

## 보안 강화

### 세션 보안

```javascript
// security-manager.js
class SecurityManager {
    constructor(authManager) {
        this.auth = authManager;
        this.activityTimeout = 30 * 60 * 1000; // 30분
        this.warningTimeout = 5 * 60 * 1000; // 5분 전 경고
        this.lastActivity = Date.now();
        
        this.init();
    }
    
    init() {
        // 사용자 활동 감지
        this.setupActivityTracking();
        
        // 세션 타임아웃 체크
        this.startSessionTimeout();
        
        // 페이지 가시성 변경 감지
        this.setupVisibilityTracking();
        
        // 탭 변경 감지
        this.setupTabChangeDetection();
    }
    
    setupActivityTracking() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.updateLastActivity();
            }, true);
        });
    }
    
    updateLastActivity() {
        this.lastActivity = Date.now();
    }
    
    startSessionTimeout() {
        setInterval(() => {
            const now = Date.now();
            const timeSinceLastActivity = now - this.lastActivity;
            
            // 경고 시간 도달
            if (timeSinceLastActivity >= this.activityTimeout - this.warningTimeout &&
                timeSinceLastActivity < this.activityTimeout) {
                this.showTimeoutWarning();
            }
            
            // 타임아웃 도달
            if (timeSinceLastActivity >= this.activityTimeout) {
                this.handleSessionTimeout();
            }
        }, 60000); // 1분마다 체크
    }
    
    showTimeoutWarning() {
        if (this.warningShown) return;
        
        this.warningShown = true;
        const remainingTime = Math.ceil((this.activityTimeout - (Date.now() - this.lastActivity)) / 1000);
        
        if (confirm(`세션이 ${Math.ceil(remainingTime / 60)}분 후에 만료됩니다. 계속 사용하시겠습니까?`)) {
            this.updateLastActivity();
            this.warningShown = false;
        }
    }
    
    handleSessionTimeout() {
        alert('비활성 상태로 인해 세션이 만료되었습니다. 다시 로그인해주세요.');
        this.auth.logout(true);
    }
    
    setupVisibilityTracking() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // 페이지가 숨겨졌을 때의 처리
                this.pageHiddenTime = Date.now();
            } else {
                // 페이지가 다시 보일 때의 처리
                if (this.pageHiddenTime) {
                    const hiddenDuration = Date.now() - this.pageHiddenTime;
                    
                    // 장시간 숨겨져 있었다면 세션 검증
                    if (hiddenDuration > 5 * 60 * 1000) { // 5분
                        this.validateSession();
                    }
                }
            }
        });
    }
    
    setupTabChangeDetection() {
        window.addEventListener('beforeunload', () => {
            // 페이지 떠날 때 마지막 활동 시간 저장
            sessionStorage.setItem('lastActivity', this.lastActivity.toString());
        });
        
        window.addEventListener('load', () => {
            // 페이지 로드 시 마지막 활동 시간 복원
            const stored = sessionStorage.getItem('lastActivity');
            if (stored) {
                this.lastActivity = parseInt(stored);
            }
        });
    }
    
    async validateSession() {
        if (this.auth.isAuthenticated()) {
            await this.auth.checkAuthStatus();
        }
    }
    
    // CSRF 토큰 관리
    async getCSRFToken() {
        try {
            const response = await fetch(`${this.auth.config.apiEndpoint}/csrf-token`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.token;
            }
        } catch (error) {
            console.error('Failed to get CSRF token:', error);
        }
        
        return null;
    }
    
    // XSS 방지를 위한 입력 정화
    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }
    
    // 안전한 HTML 렌더링
    safeHTML(html) {
        const allowedTags = ['b', 'i', 'u', 'strong', 'em', 'br', 'p'];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // 허용되지 않은 태그 제거
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach(el => {
            if (!allowedTags.includes(el.tagName.toLowerCase())) {
                el.remove();
            }
        });
        
        return tempDiv.innerHTML;
    }
}

// 사용 예제
const securityManager = new SecurityManager(auth);
```

## 관련 문서

- [순수 JavaScript 로그인 폼](./account/login-form.md)
- [순수 JavaScript 회원가입 폼](./account/signup-form.md)
- [jQuery 연동 예제](./jquery-example.md)
- [React 인증 시스템](../react/auth-components.md)
- [Vue 인증 시스템](../vue/auth-composable.md)