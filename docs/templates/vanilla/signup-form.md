# 순수 HTML/JavaScript 회원가입 폼

AIApp BaaS와 연동되는 순수 HTML과 JavaScript를 사용한 회원가입 폼 구현 가이드입니다.

## 기본 회원가입 폼

### HTML 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>회원가입</title>
    <style>
        .signup-container {
            max-width: 500px;
            margin: 30px auto;
            padding: 25px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #333;
        }
        
        .form-group label .required {
            color: #dc3545;
        }
        
        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 16px;
            box-sizing: border-box;
            transition: border-color 0.2s;
        }
        
        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #28a745;
            box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25);
        }
        
        .form-group input:disabled {
            background-color: #f8f9fa;
            color: #6c757d;
            cursor: not-allowed;
        }
        
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .checkbox-group input[type="checkbox"] {
            width: auto;
            margin: 0;
        }
        
        .submit-button {
            width: 100%;
            padding: 14px;
            background-color: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .submit-button:hover:not(:disabled) {
            background-color: #218838;
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
        
        .field-error {
            color: #dc3545;
            font-size: 14px;
            margin-top: 5px;
            display: none;
        }
        
        .field-error.show {
            display: block;
        }
        
        .input-error {
            border-color: #dc3545 !important;
        }
        
        .password-strength {
            margin-top: 5px;
            font-size: 14px;
        }
        
        .strength-weak { color: #dc3545; }
        .strength-medium { color: #ffc107; }
        .strength-strong { color: #28a745; }
        
        .custom-fields {
            border-top: 1px solid #eee;
            padding-top: 20px;
            margin-top: 20px;
        }
        
        .custom-fields h3 {
            margin-bottom: 15px;
            color: #495057;
            font-size: 18px;
        }
        
        h2 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <div class="signup-container">
        <form id="signupForm">
            <h2>회원가입</h2>
            
            <div id="messageContainer"></div>
            
            <!-- 기본 필드 -->
            <div class="form-group">
                <label for="user_id">
                    아이디 <span class="required">*</span>
                </label>
                <input 
                    type="text" 
                    id="user_id" 
                    name="user_id" 
                    placeholder="4-20자 영문/숫자"
                    required
                    minlength="4"
                    maxlength="20"
                    pattern="[a-zA-Z0-9]+"
                >
                <div class="field-error" id="user_id_error"></div>
            </div>
            
            <div class="form-group">
                <label for="user_pw">
                    비밀번호 <span class="required">*</span>
                </label>
                <input 
                    type="password" 
                    id="user_pw" 
                    name="user_pw" 
                    placeholder="최소 8자 이상"
                    required
                    minlength="8"
                >
                <div class="password-strength" id="password_strength"></div>
                <div class="field-error" id="user_pw_error"></div>
            </div>
            
            <div class="form-group">
                <label for="user_pw_confirm">
                    비밀번호 확인 <span class="required">*</span>
                </label>
                <input 
                    type="password" 
                    id="user_pw_confirm" 
                    name="user_pw_confirm" 
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                >
                <div class="field-error" id="user_pw_confirm_error"></div>
            </div>
            
            <div class="form-group">
                <label for="name">
                    이름 <span class="required">*</span>
                </label>
                <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    placeholder="실명을 입력하세요"
                    required
                >
                <div class="field-error" id="name_error"></div>
            </div>
            
            <div class="form-group">
                <label for="phone">
                    전화번호 <span class="required">*</span>
                </label>
                <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    placeholder="010-1234-5678"
                    pattern="010-\d{4}-\d{4}"
                    required
                >
                <div class="field-error" id="phone_error"></div>
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
            
            <!-- 사용자 정의 필드 -->
            <div class="custom-fields" id="customFields" style="display: none;">
                <h3>추가 정보</h3>
                <div id="customFieldsContainer"></div>
            </div>
            
            <!-- 예약 계정 옵션 -->
            <div class="form-group">
                <div class="checkbox-group">
                    <input 
                        type="checkbox" 
                        id="is_reserved" 
                        name="is_reserved"
                    >
                    <label for="is_reserved">예약 계정으로 생성</label>
                </div>
            </div>
            
            <button type="submit" id="submitButton" class="submit-button">
                회원가입
            </button>
        </form>
    </div>

    <script>
        // 설정
        const CONFIG = {
            API_ENDPOINT: 'https://api.aiapp.link',
            PROJECT_ID: '[PROJECT_ID]', // 프로젝트별 고유 ID
            CUSTOM_FIELDS: ['age', 'department'] // 사용자 정의 필드
        };

        class SignupManager {
            constructor() {
                this.form = document.getElementById('signupForm');
                this.submitButton = document.getElementById('submitButton');
                this.messageContainer = document.getElementById('messageContainer');
                this.loading = false;
                
                this.init();
            }
            
            init() {
                // 프로젝트 ID 설정
                document.getElementById('project_id').value = CONFIG.PROJECT_ID;
                
                // 사용자 정의 필드 생성
                this.createCustomFields();
                
                // 이벤트 리스너 등록
                this.attachEventListeners();
            }
            
            createCustomFields() {
                if (CONFIG.CUSTOM_FIELDS && CONFIG.CUSTOM_FIELDS.length > 0) {
                    const container = document.getElementById('customFieldsContainer');
                    const customFieldsDiv = document.getElementById('customFields');
                    
                    CONFIG.CUSTOM_FIELDS.forEach(fieldName => {
                        const fieldGroup = document.createElement('div');
                        fieldGroup.className = 'form-group';
                        
                        const label = document.createElement('label');
                        label.setAttribute('for', fieldName);
                        label.textContent = this.getFieldLabel(fieldName);
                        
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.id = fieldName;
                        input.name = fieldName;
                        input.placeholder = `${this.getFieldLabel(fieldName)}를 입력하세요`;
                        
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'field-error';
                        errorDiv.id = `${fieldName}_error`;
                        
                        fieldGroup.appendChild(label);
                        fieldGroup.appendChild(input);
                        fieldGroup.appendChild(errorDiv);
                        container.appendChild(fieldGroup);
                    });
                    
                    customFieldsDiv.style.display = 'block';
                }
            }
            
            getFieldLabel(fieldName) {
                const labels = {
                    age: '나이',
                    department: '부서',
                    company: '회사명',
                    position: '직책',
                    address: '주소'
                };
                return labels[fieldName] || fieldName;
            }
            
            attachEventListeners() {
                // 폼 제출
                this.form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSubmit();
                });
                
                // 실시간 유효성 검사
                this.form.addEventListener('input', (e) => {
                    this.validateField(e.target);
                });
                
                // 비밀번호 강도 체크
                document.getElementById('user_pw').addEventListener('input', (e) => {
                    this.checkPasswordStrength(e.target.value);
                });
                
                // 전화번호 자동 포맷팅
                document.getElementById('phone').addEventListener('input', (e) => {
                    this.formatPhoneNumber(e.target);
                });
            }
            
            async handleSubmit() {
                if (this.loading) return;
                
                this.setLoading(true);
                this.clearMessages();
                this.clearFieldErrors();
                
                try {
                    const formData = new FormData(this.form);
                    const signupData = this.buildSignupData(formData);
                    
                    // 폼 유효성 검사
                    const validation = this.validateForm(signupData);
                    if (!validation.valid) {
                        this.showFieldErrors(validation.errors);
                        return;
                    }
                    
                    const result = await this.signup(signupData);
                    
                    if (result.success) {
                        this.showMessage('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.', 'success');
                        
                        // 성공 후 처리
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 2000);
                        
                        // 커스텀 이벤트 발생
                        this.dispatchSignupSuccess(result.data);
                    }
                } catch (error) {
                    this.handleError(error);
                } finally {
                    this.setLoading(false);
                }
            }
            
            buildSignupData(formData) {
                const data = {
                    user_id: formData.get('user_id'),
                    user_pw: formData.get('user_pw'),
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    is_reserved: formData.get('is_reserved') === 'on',
                    project_id: CONFIG.PROJECT_ID
                };
                
                // 사용자 정의 필드 추가
                if (CONFIG.CUSTOM_FIELDS && CONFIG.CUSTOM_FIELDS.length > 0) {
                    data.data = {};
                    CONFIG.CUSTOM_FIELDS.forEach(fieldName => {
                        const value = formData.get(fieldName);
                        if (value && value.trim()) {
                            data.data[fieldName] = value.trim();
                        }
                    });
                }
                
                return data;
            }
            
            validateForm(data) {
                const errors = {};
                
                // 아이디 검증
                if (!data.user_id || data.user_id.length < 4) {
                    errors.user_id = '아이디는 4자 이상이어야 합니다.';
                } else if (data.user_id.length > 20) {
                    errors.user_id = '아이디는 20자 이하여야 합니다.';
                } else if (!/^[a-zA-Z0-9]+$/.test(data.user_id)) {
                    errors.user_id = '아이디는 영문자와 숫자만 사용할 수 있습니다.';
                }
                
                // 비밀번호 검증
                if (!data.user_pw || data.user_pw.length < 8) {
                    errors.user_pw = '비밀번호는 최소 8자 이상이어야 합니다.';
                }
                
                // 비밀번호 확인 검증
                const confirmPassword = document.getElementById('user_pw_confirm').value;
                if (data.user_pw !== confirmPassword) {
                    errors.user_pw_confirm = '비밀번호가 일치하지 않습니다.';
                }
                
                // 이름 검증
                if (!data.name || data.name.trim().length === 0) {
                    errors.name = '이름을 입력해주세요.';
                }
                
                // 전화번호 검증
                if (!data.phone || !/^010-\d{4}-\d{4}$/.test(data.phone)) {
                    errors.phone = '올바른 전화번호 형식으로 입력해주세요. (010-1234-5678)';
                }
                
                return {
                    valid: Object.keys(errors).length === 0,
                    errors
                };
            }
            
            validateField(field) {
                const fieldName = field.name;
                const value = field.value;
                let error = '';
                
                switch (fieldName) {
                    case 'user_id':
                        if (value && (value.length < 4 || value.length > 20)) {
                            error = '아이디는 4-20자여야 합니다.';
                        } else if (value && !/^[a-zA-Z0-9]+$/.test(value)) {
                            error = '영문자와 숫자만 사용 가능합니다.';
                        }
                        break;
                        
                    case 'user_pw_confirm':
                        const password = document.getElementById('user_pw').value;
                        if (value && value !== password) {
                            error = '비밀번호가 일치하지 않습니다.';
                        }
                        break;
                        
                    case 'phone':
                        if (value && !/^010-\d{4}-\d{4}$/.test(value)) {
                            error = '010-1234-5678 형식으로 입력해주세요.';
                        }
                        break;
                }
                
                this.showFieldError(fieldName, error);
            }
            
            checkPasswordStrength(password) {
                const strengthElement = document.getElementById('password_strength');
                
                if (!password) {
                    strengthElement.textContent = '';
                    return;
                }
                
                let strength = 0;
                let strengthText = '';
                let strengthClass = '';
                
                // 길이 체크
                if (password.length >= 8) strength += 1;
                
                // 대소문자 체크
                if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
                
                // 숫자 체크
                if (/\d/.test(password)) strength += 1;
                
                // 특수문자 체크
                if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 1;
                
                if (strength <= 1) {
                    strengthText = '약함';
                    strengthClass = 'strength-weak';
                } else if (strength <= 2) {
                    strengthText = '보통';
                    strengthClass = 'strength-medium';
                } else {
                    strengthText = '강함';
                    strengthClass = 'strength-strong';
                }
                
                strengthElement.textContent = `비밀번호 강도: ${strengthText}`;
                strengthElement.className = `password-strength ${strengthClass}`;
            }
            
            formatPhoneNumber(input) {
                let value = input.value.replace(/\D/g, '');
                
                if (value.startsWith('010')) {
                    if (value.length <= 3) {
                        value = value;
                    } else if (value.length <= 7) {
                        value = value.slice(0, 3) + '-' + value.slice(3);
                    } else {
                        value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
                    }
                }
                
                input.value = value;
            }
            
            async signup(data) {
                const response = await fetch(`${CONFIG.API_ENDPOINT}/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`HTTP ${response.status}: ${errorData.message || '회원가입에 실패했습니다.'}`);
                }
                
                return await response.json();
            }
            
            handleError(error) {
                let errorMessage = '회원가입에 실패했습니다.';
                
                if (error.message.includes('422')) {
                    errorMessage = '입력값을 확인해주세요.';
                } else if (error.message.includes('409')) {
                    errorMessage = '이미 사용 중인 아이디입니다.';
                } else if (error.message.includes('500')) {
                    errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                }
                
                this.showMessage(errorMessage, 'error');
            }
            
            setLoading(loading) {
                this.loading = loading;
                this.submitButton.disabled = loading;
                this.submitButton.textContent = loading ? '가입 중...' : '회원가입';
                
                // 입력 필드 비활성화
                const inputs = this.form.querySelectorAll('input:not([disabled])');
                inputs.forEach(input => {
                    input.disabled = loading;
                });
                
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
            
            showFieldError(fieldName, error) {
                const errorElement = document.getElementById(`${fieldName}_error`);
                const inputElement = document.getElementById(fieldName);
                
                if (errorElement) {
                    if (error) {
                        errorElement.textContent = error;
                        errorElement.classList.add('show');
                        inputElement.classList.add('input-error');
                    } else {
                        errorElement.classList.remove('show');
                        inputElement.classList.remove('input-error');
                    }
                }
            }
            
            showFieldErrors(errors) {
                Object.keys(errors).forEach(fieldName => {
                    this.showFieldError(fieldName, errors[fieldName]);
                });
                
                // 첫 번째 에러 필드로 스크롤
                const firstErrorField = document.querySelector('.input-error');
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstErrorField.focus();
                }
            }
            
            clearFieldErrors() {
                const errorElements = document.querySelectorAll('.field-error.show');
                const inputElements = document.querySelectorAll('.input-error');
                
                errorElements.forEach(el => el.classList.remove('show'));
                inputElements.forEach(el => el.classList.remove('input-error'));
            }
            
            dispatchSignupSuccess(userData) {
                const event = new CustomEvent('signupSuccess', {
                    detail: { user: userData }
                });
                document.dispatchEvent(event);
            }
        }
        
        // 페이지 로드 시 초기화
        document.addEventListener('DOMContentLoaded', () => {
            window.signupManager = new SignupManager();
        });
        
        // 회원가입 성공 이벤트 리스너 예제
        document.addEventListener('signupSuccess', (event) => {
            console.log('회원가입 성공:', event.detail.user);
        });
    </script>
</body>
</html>
```

## ES6 모듈 버전

### signup.js

```javascript
// signup.js
export class SignupManager {
    constructor(config = {}) {
        this.config = {
            apiEndpoint: 'https://api.aiapp.link',
            projectId: config.projectId || '[PROJECT_ID]',
            customFields: config.customFields || [],
            redirectUrl: config.redirectUrl || '/login',
            ...config
        };
        
        this.loading = false;
        this.callbacks = {
            onSuccess: config.onSuccess || this.defaultSuccessHandler.bind(this),
            onError: config.onError || this.defaultErrorHandler.bind(this)
        };
    }
    
    async signup(userData) {
        this.loading = true;
        
        try {
            // 클라이언트 사이드 유효성 검사
            const validation = this.validateSignupData(userData);
            if (!validation.valid) {
                throw new Error(validation.errors[0] || '입력값을 확인해주세요.');
            }
            
            const signupData = {
                user_id: userData.user_id,
                user_pw: userData.user_pw,
                name: userData.name,
                phone: userData.phone,
                is_reserved: userData.is_reserved || false,
                project_id: this.config.projectId,
                ...(userData.data && { data: userData.data })
            };
            
            const response = await fetch(`${this.config.apiEndpoint}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signupData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '회원가입에 실패했습니다.');
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.callbacks.onSuccess(result.data);
                return result;
            } else {
                throw new Error(result.message || '회원가입에 실패했습니다.');
            }
        } catch (error) {
            this.callbacks.onError(error);
            throw error;
        } finally {
            this.loading = false;
        }
    }
    
    validateSignupData(data) {
        const errors = [];
        
        // 필수 필드 검증
        if (!data.user_id || data.user_id.length < 4) {
            errors.push('아이디는 4자 이상이어야 합니다.');
        }
        
        if (!data.user_pw || data.user_pw.length < 8) {
            errors.push('비밀번호는 8자 이상이어야 합니다.');
        }
        
        if (!data.name || data.name.trim().length === 0) {
            errors.push('이름을 입력해주세요.');
        }
        
        if (!data.phone || !/^010-\d{4}-\d{4}$/.test(data.phone)) {
            errors.push('올바른 전화번호 형식으로 입력해주세요.');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    defaultSuccessHandler(userData) {
        console.log('회원가입 성공:', userData);
        alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
        
        setTimeout(() => {
            window.location.href = this.config.redirectUrl;
        }, 1000);
    }
    
    defaultErrorHandler(error) {
        console.error('회원가입 실패:', error);
        
        let errorMessage = '회원가입에 실패했습니다.';
        if (error.message.includes('409')) {
            errorMessage = '이미 사용 중인 아이디입니다.';
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

## 중복 확인 기능

### 아이디 중복 확인

```javascript
class DuplicationChecker {
    constructor(apiEndpoint = 'https://api.aiapp.link') {
        this.apiEndpoint = apiEndpoint;
        this.cache = new Map();
        this.checkTimeout = null;
    }
    
    async checkUserId(userId, projectId) {
        // 캐시 확인
        const cacheKey = `${userId}-${projectId}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await fetch(`${this.apiEndpoint}/check-userid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    project_id: projectId
                })
            });
            
            const result = await response.json();
            const isAvailable = result.available;
            
            // 결과 캐시
            this.cache.set(cacheKey, isAvailable);
            
            return isAvailable;
        } catch (error) {
            console.error('아이디 중복 확인 실패:', error);
            return null; // 확인 실패 시 null 반환
        }
    }
    
    setupRealtimeCheck(inputElement, projectId, callback) {
        inputElement.addEventListener('input', (e) => {
            clearTimeout(this.checkTimeout);
            
            const userId = e.target.value.trim();
            if (userId.length < 4) {
                callback(null, '아이디는 4자 이상이어야 합니다.');
                return;
            }
            
            // 500ms 후 중복 확인 실행
            this.checkTimeout = setTimeout(async () => {
                const isAvailable = await this.checkUserId(userId, projectId);
                
                if (isAvailable === null) {
                    callback(null, '중복 확인 중 오류가 발생했습니다.');
                } else if (isAvailable) {
                    callback(true, '사용 가능한 아이디입니다.');
                } else {
                    callback(false, '이미 사용 중인 아이디입니다.');
                }
            }, 500);
        });
    }
}

// 사용 예제
const duplicationChecker = new DuplicationChecker();
const userIdInput = document.getElementById('user_id');

duplicationChecker.setupRealtimeCheck(
    userIdInput,
    CONFIG.PROJECT_ID,
    (isAvailable, message) => {
        const statusElement = document.getElementById('userid_status');
        
        if (isAvailable === true) {
            statusElement.className = 'field-success';
            statusElement.textContent = message;
        } else {
            statusElement.className = 'field-error show';
            statusElement.textContent = message;
        }
    }
);
```

## 단계별 회원가입

### 다단계 폼

```javascript
class MultiStepSignup {
    constructor(steps = ['basic', 'details', 'verification']) {
        this.steps = steps;
        this.currentStep = 0;
        this.formData = {};
        
        this.init();
    }
    
    init() {
        this.showStep(0);
        this.updateProgress();
    }
    
    showStep(stepIndex) {
        // 모든 스텝 숨기기
        document.querySelectorAll('.signup-step').forEach(step => {
            step.style.display = 'none';
        });
        
        // 현재 스텝만 표시
        const currentStepElement = document.getElementById(`step-${this.steps[stepIndex]}`);
        if (currentStepElement) {
            currentStepElement.style.display = 'block';
        }
        
        this.currentStep = stepIndex;
        this.updateProgress();
        this.updateButtons();
    }
    
    nextStep() {
        if (this.validateCurrentStep()) {
            this.saveCurrentStepData();
            
            if (this.currentStep < this.steps.length - 1) {
                this.showStep(this.currentStep + 1);
            } else {
                this.submitForm();
            }
        }
    }
    
    prevStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }
    
    validateCurrentStep() {
        const stepElement = document.getElementById(`step-${this.steps[this.currentStep]}`);
        const inputs = stepElement.querySelectorAll('input[required]');
        let valid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('input-error');
                valid = false;
            } else {
                input.classList.remove('input-error');
            }
        });
        
        return valid;
    }
    
    saveCurrentStepData() {
        const stepElement = document.getElementById(`step-${this.steps[this.currentStep]}`);
        const inputs = stepElement.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                this.formData[input.name] = input.checked;
            } else {
                this.formData[input.name] = input.value;
            }
        });
    }
    
    updateProgress() {
        const progress = ((this.currentStep + 1) / this.steps.length) * 100;
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        // 단계 표시 업데이트
        const stepIndicator = document.querySelector('.step-indicator');
        if (stepIndicator) {
            stepIndicator.textContent = `${this.currentStep + 1} / ${this.steps.length}`;
        }
    }
    
    updateButtons() {
        const prevButton = document.getElementById('prevButton');
        const nextButton = document.getElementById('nextButton');
        
        if (prevButton) {
            prevButton.style.display = this.currentStep === 0 ? 'none' : 'block';
        }
        
        if (nextButton) {
            nextButton.textContent = this.currentStep === this.steps.length - 1 ? '회원가입 완료' : '다음';
        }
    }
    
    async submitForm() {
        try {
            const signupManager = new SignupManager();
            await signupManager.signup(this.formData);
        } catch (error) {
            console.error('회원가입 실패:', error);
        }
    }
}
```

## 반응형 디자인

### 모바일 최적화 CSS

```css
@media (max-width: 768px) {
    .signup-container {
        margin: 10px;
        padding: 20px;
        border-radius: 0;
        box-shadow: none;
    }
    
    .form-group {
        margin-bottom: 15px;
    }
    
    .form-group input,
    .form-group textarea,
    .submit-button {
        font-size: 16px; /* iOS 줌 방지 */
        padding: 14px;
    }
    
    .custom-fields {
        padding-top: 15px;
        margin-top: 15px;
    }
}

@media (max-width: 480px) {
    .signup-container {
        margin: 5px;
        padding: 15px;
    }
    
    h2 {
        font-size: 24px;
        margin-bottom: 20px;
    }
    
    .checkbox-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
    }
}

/* 다크 모드 지원 */
@media (prefers-color-scheme: dark) {
    .signup-container {
        background-color: #2d3748;
        border-color: #4a5568;
        color: #f7fafc;
    }
    
    .form-group input,
    .form-group textarea {
        background-color: #4a5568;
        border-color: #718096;
        color: #f7fafc;
    }
    
    .form-group input:focus,
    .form-group textarea:focus {
        border-color: #68d391;
        box-shadow: 0 0 0 2px rgba(104, 211, 145, 0.25);
    }
    
    .submit-button {
        background-color: #38a169;
    }
    
    .submit-button:hover:not(:disabled) {
        background-color: #2f855a;
    }
}
```

## 관련 문서

- [순수 JavaScript 로그인 폼](./login-form.md)
- [인증 상태 관리자](./auth-manager.md)
- [jQuery 연동 예제](./jquery-example.md)
- [React 인증 컴포넌트](../react/auth-components.md)
- [Vue 인증 컴포넌트](../vue/auth-composable.md)