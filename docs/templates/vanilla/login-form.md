# 순수 HTML/JavaScript 로그인 폼

AIApp BaaS와 연동되는 순수 HTML과 JavaScript를 사용한 로그인 폼 구현 가이드입니다.

## ⚠️ BaaS API 필수 요구사항

**LLM 코드 생성 시 반드시 포함해야 할 사항:**

- **API Base URL**: `https://api.aiapp.link`
- **project_id**: 필수 파라미터 - 없으면 401 에러 발생
- **쿠키 설정**: `credentials: 'include'` 필수
- **로그인 응답**: `{ success, message, data: { access_token, token_type } }`
- **에러 응답**: `{ errorCode, message, detail: [...] }`

## 기본 로그인 폼

### HTML 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>로그인</title>
    <style>
        .login-container {
            max-width: 400px;
            margin: 50px auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-family: Arial, sans-serif;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
        }
        
        .form-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 16px;
            box-sizing: border-box;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
        
        .form-group input:disabled {
            background-color: #f8f9fa;
            color: #6c757d;
            cursor: not-allowed;
        }
        
        .submit-button {
            width: 100%;
            padding: 12px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .submit-button:hover:not(:disabled) {
            background-color: #0056b3;
        }
        
        .submit-button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }
        
        .error-message {
            background-color: #f8d7da;
            color: #721c24;
            padding: 12px;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            margin-bottom: 15px;
        }
        
        .success-message {
            background-color: #d4edda;
            color: #155724;
            padding: 12px;
            border: 1px solid #c3e6cb;
            border-radius: 4px;
            margin-bottom: 15px;
        }
        
        h2 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <form id="loginForm">
            <h2>로그인</h2>
            
            <div id="messageContainer"></div>
            
            <div class="form-group">
                <label for="user_id">아이디</label>
                <input 
                    type="text" 
                    id="user_id" 
                    name="user_id" 
                    placeholder="아이디를 입력하세요"
                    required
                >
            </div>
            
            <div class="form-group">
                <label for="user_pw">비밀번호</label>
                <input 
                    type="password" 
                    id="user_pw" 
                    name="user_pw" 
                    placeholder="비밀번호를 입력하세요"
                    required
                >
            </div>
            
            <div class="form-group">
                <label for="project_id">프로젝트 ID</label>
                <input 
                    type="text" 
                    id="project_id" 
                    name="project_id" 
                    value="[PROJECT_ID]"
                    disabled
                    style="background-color: #f5f5f5;"
                >
            </div>
            
            <button type="submit" id="submitButton" class="submit-button">
                로그인
            </button>
        </form>
    </div>

    <script>
        // 설정
        const CONFIG = {
            API_ENDPOINT: 'https://api.aiapp.link',
            PROJECT_ID: '[PROJECT_ID]' // 프로젝트별 고유 ID
        };

        class LoginManager {
            constructor() {
                this.form = document.getElementById('loginForm');
                this.submitButton = document.getElementById('submitButton');
                this.messageContainer = document.getElementById('messageContainer');
                this.loading = false;
                
                this.init();
            }
            
            init() {
                // 프로젝트 ID 설정
                document.getElementById('project_id').value = CONFIG.PROJECT_ID;
                
                // 폼 제출 이벤트 리스너
                this.form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSubmit();
                });
            }
            
            async handleSubmit() {
                if (this.loading) return;
                
                this.setLoading(true);
                this.clearMessages();
                
                try {
                    const formData = new FormData(this.form);
                    const loginData = {
                        user_id: formData.get('user_id'),
                        user_pw: formData.get('user_pw'),
                        project_id: CONFIG.PROJECT_ID
                    };
                    
                    // 클라이언트 유효성 검사
                    if (!this.validateForm(loginData)) {
                        return;
                    }
                    
                    const result = await this.login(loginData);
                    
                    if (result.success) {
                        this.showMessage('로그인이 완료되었습니다.', 'success');
                        
                        // 성공 후 처리
                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 1000);
                        
                        // 커스텀 이벤트 발생
                        this.dispatchLoginSuccess(result.data);
                    }
                } catch (error) {
                    this.handleError(error);
                } finally {
                    this.setLoading(false);
                }
            }
            
            validateForm(data) {
                if (!data.user_id || data.user_id.trim().length === 0) {
                    this.showMessage('아이디를 입력해주세요.', 'error');
                    return false;
                }
                
                if (!data.user_pw || data.user_pw.trim().length === 0) {
                    this.showMessage('비밀번호를 입력해주세요.', 'error');
                    return false;
                }
                
                return true;
            }
            
            async login(credentials) {
                const response = await fetch(`${CONFIG.API_ENDPOINT}/account/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(credentials),
                    credentials: 'include' // 쿠키 포함
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                return await response.json();
            }
            
            handleError(error) {
                let errorMessage = '로그인에 실패했습니다.';
                
                if (error.message.includes('422')) {
                    errorMessage = '입력값을 확인해주세요.';
                } else if (error.message.includes('401')) {
                    errorMessage = '아이디 또는 비밀번호가 올바르지 않습니다.';
                } else if (error.message.includes('403')) {
                    errorMessage = '접근 권한이 없습니다.';
                } else if (error.message.includes('500')) {
                    errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                }
                
                this.showMessage(errorMessage, 'error');
            }
            
            setLoading(loading) {
                this.loading = loading;
                this.submitButton.disabled = loading;
                this.submitButton.textContent = loading ? '로그인 중...' : '로그인';
                
                // 입력 필드 비활성화
                const inputs = this.form.querySelectorAll('input:not([disabled])');
                inputs.forEach(input => {
                    input.disabled = loading;
                });
                
                // 로딩 해제 시 입력 필드 다시 활성화
                if (!loading) {
                    setTimeout(() => {
                        inputs.forEach(input => {
                            input.disabled = false;
                        });
                    }, 100);
                }
            }
            
            showMessage(message, type = 'error') {
                const className = type === 'error' ? 'error-message' : 'success-message';
                this.messageContainer.innerHTML = `
                    <div class="${className}">${message}</div>
                `;
            }
            
            clearMessages() {
                this.messageContainer.innerHTML = '';
            }
            
            dispatchLoginSuccess(userData) {
                const event = new CustomEvent('loginSuccess', {
                    detail: { user: userData }
                });
                document.dispatchEvent(event);
            }
        }
        
        // 페이지 로드 시 초기화
        document.addEventListener('DOMContentLoaded', () => {
            window.loginManager = new LoginManager();
        });
        
        // 로그인 성공 이벤트 리스너 예제
        document.addEventListener('loginSuccess', (event) => {
            console.log('로그인 성공:', event.detail.user);
            
            // 사용자 정보를 로컬 스토리지에 저장 (선택사항)
            // localStorage.setItem('user', JSON.stringify(event.detail.user));
        });
    </script>
</body>
</html>
```

## ES6 모듈 버전

### login.js

```javascript
// login.js
export class LoginManager {
    constructor(config = {}) {
        this.config = {
            apiEndpoint: 'https://api.aiapp.link',
            projectId: config.projectId || '[PROJECT_ID]',
            redirectUrl: config.redirectUrl || '/dashboard',
            ...config
        };
        
        this.loading = false;
        this.callbacks = {
            onSuccess: config.onSuccess || this.defaultSuccessHandler.bind(this),
            onError: config.onError || this.defaultErrorHandler.bind(this)
        };
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
                this.callbacks.onSuccess(result.data);
                return result;
            } else {
                throw new Error(result.message || '로그인에 실패했습니다.');
            }
        } catch (error) {
            this.callbacks.onError(error);
            throw error;
        } finally {
            this.loading = false;
        }
    }
    
    defaultSuccessHandler(userData) {
        console.log('로그인 성공:', userData);
        
        // 성공 후 리디렉션
        setTimeout(() => {
            window.location.href = this.config.redirectUrl;
        }, 1000);
    }
    
    defaultErrorHandler(error) {
        console.error('로그인 실패:', error);
        
        let errorMessage = '로그인에 실패했습니다.';
        if (error.message.includes('401')) {
            errorMessage = '아이디 또는 비밀번호가 올바르지 않습니다.';
        } else if (error.message.includes('422')) {
            errorMessage = '입력값을 확인해주세요.';
        }
        
        alert(errorMessage);
    }
    
    isLoading() {
        return this.loading;
    }
}
```

### 사용 예제

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>모듈형 로그인</title>
</head>
<body>
    <div id="loginContainer">
        <!-- 로그인 폼 HTML -->
    </div>

    <script type="module">
        import { LoginManager } from './account/login.js';
        
        const loginManager = new LoginManager({
            projectId: 'your-project-id-here',
            onSuccess: (userData) => {
                alert(`환영합니다, ${userData.name}님!`);
                window.location.href = '/dashboard';
            },
            onError: (error) => {
                document.getElementById('errorMessage').textContent = 
                    '로그인에 실패했습니다.';
            }
        });
        
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const credentials = {
                user_id: formData.get('user_id'),
                user_pw: formData.get('user_pw')
            };
            
            try {
                await loginManager.login(credentials);
            } catch (error) {
                // 에러는 이미 핸들러에서 처리됨
            }
        });
    </script>
</body>
</html>
```

## 고급 기능

### 자동 로그인 상태 확인

```javascript
class AuthChecker {
    constructor(apiEndpoint = 'https://api.aiapp.link') {
        this.apiEndpoint = apiEndpoint;
    }
    
    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.apiEndpoint}/account/info`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.success ? result.data : null;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
        
        return null;
    }
    
    async redirectIfAuthenticated(redirectUrl = '/dashboard') {
        const user = await this.checkAuthStatus();
        if (user) {
            window.location.href = redirectUrl;
            return true;
        }
        return false;
    }
}

// 사용 예제
document.addEventListener('DOMContentLoaded', async () => {
    const authChecker = new AuthChecker();
    
    // 이미 로그인된 사용자는 대시보드로 리디렉션
    const isAuthenticated = await authChecker.redirectIfAuthenticated();
    
    if (!isAuthenticated) {
        // 로그인 폼 초기화
        window.loginManager = new LoginManager();
    }
});
```

### 폼 유효성 검사 강화

```javascript
class FormValidator {
    static validateUserId(userId) {
        if (!userId || userId.trim().length === 0) {
            return '아이디를 입력해주세요.';
        }
        
        if (userId.length < 4) {
            return '아이디는 4자 이상이어야 합니다.';
        }
        
        if (userId.length > 20) {
            return '아이디는 20자 이하여야 합니다.';
        }
        
        if (!/^[a-zA-Z0-9]+$/.test(userId)) {
            return '아이디는 영문자와 숫자만 사용할 수 있습니다.';
        }
        
        return null;
    }
    
    static validatePassword(password) {
        if (!password || password.trim().length === 0) {
            return '비밀번호를 입력해주세요.';
        }
        
        if (password.length < 8) {
            return '비밀번호는 8자 이상이어야 합니다.';
        }
        
        return null;
    }
    
    static validateLoginForm(data) {
        const errors = {};
        
        const userIdError = this.validateUserId(data.user_id);
        if (userIdError) errors.user_id = userIdError;
        
        const passwordError = this.validatePassword(data.user_pw);
        if (passwordError) errors.user_pw = passwordError;
        
        return Object.keys(errors).length === 0 ? null : errors;
    }
}
```

## 스타일 커스터마이징

### CSS 변수 활용

```css
:root {
    --primary-color: #007bff;
    --primary-hover: #0056b3;
    --error-color: #dc3545;
    --success-color: #28a745;
    --border-color: #ddd;
    --border-radius: 8px;
    --box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.login-container {
    --container-max-width: 400px;
    --container-padding: 20px;
    
    max-width: var(--container-max-width);
    padding: var(--container-padding);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    margin: 50px auto;
}

.submit-button {
    background-color: var(--primary-color);
}

.submit-button:hover:not(:disabled) {
    background-color: var(--primary-hover);
}
```

### 반응형 디자인

```css
@media (max-width: 480px) {
    .login-container {
        margin: 20px;
        padding: 15px;
    }
    
    .form-group input,
    .submit-button {
        font-size: 16px; /* iOS에서 줌 방지 */
    }
}

@media (prefers-color-scheme: dark) {
    :root {
        --primary-color: #0d6efd;
        --border-color: #495057;
        --background-color: #212529;
        --text-color: #ffffff;
    }
    
    body {
        background-color: var(--background-color);
        color: var(--text-color);
    }
    
    .form-group input {
        background-color: #495057;
        border-color: #6c757d;
        color: var(--text-color);
    }
}
```

## 보안 고려사항

### CSRF 보호

```javascript
class CSRFProtection {
    static async getCSRFToken() {
        try {
            const response = await fetch('/csrf-token', {
                credentials: 'include'
            });
            const data = await response.json();
            return data.token;
        } catch (error) {
            console.error('CSRF token fetch failed:', error);
            return null;
        }
    }
    
    static async addCSRFHeader(headers = {}) {
        const token = await this.getCSRFToken();
        if (token) {
            headers['X-CSRF-Token'] = token;
        }
        return headers;
    }
}
```

### XSS 방지

```javascript
class SecurityUtils {
    static sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }
    
    static validateProjectId(projectId) {
        // UUID v4 형식 검증
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(projectId);
    }
}
```

## 관련 문서

- [순수 JavaScript 회원가입 폼](./account/signup-form.md)
- [인증 상태 관리자](./auth-manager.md)
- [jQuery 연동 예제](./jquery-example.md)
- [React 로그인 컴포넌트](../react/auth-components.md)
- [Vue 로그인 컴포넌트](../vue/account/login-component.md)