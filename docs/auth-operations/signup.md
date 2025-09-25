# 회원가입 구현 가이드

AIApp BaaS 인증 시스템의 회원가입 기능을 구현하기 위한 통합 가이드입니다. API 명세부터 React와 Vanilla JavaScript 구현 예제까지 모든 내용을 포함합니다.

## 1. API 명세

### 기본 정보

- **URL**: `/account/signup`
- **Method**: `POST`
- **Base URL**: `https://api.aiapp.link`
- **Content-Type**: `application/json`
- **Description**: 새로운 사용자 계정을 생성합니다. 각 프로젝트는 독립적인 사용자 관리를 위해 project_id가 필수입니다.

### 요청 스키마

#### 필수 필드

```json
{
  "user_id": "string",      // 사용자 ID (4-20자, 영문/숫자)
  "user_pw": "string",      // 비밀번호 (8자 이상)
  "name": "string",         // 사용자 이름
  "phone": "string",        // 전화번호 (010-1234-5678 형식)
  "is_reserved": boolean,   // 예약 계정 여부
  "project_id": "string"    // 프로젝트 ID (UUID) - 필수
}
```

#### 선택 필드

```json
{
  "data": {                 // 커스텀 데이터 필드
    "age": 25,
    "interests": ["coding", "music"],
    "company": "Example Corp"
  }
}
```

### 요청 예시

#### 기본 회원가입

```json
{
  "user_id": "johndoe",
  "user_pw": "password123",
  "name": "John Doe",
  "phone": "010-1234-5678",
  "is_reserved": false,
  "project_id": "[PROJECT_ID]"
}
```

#### 커스텀 데이터 포함 회원가입

```json
{
  "user_id": "johndoe",
  "user_pw": "password123",
  "name": "John Doe",
  "phone": "010-1234-5678",
  "is_reserved": false,
  "project_id": "[PROJECT_ID]",
  "data": {
    "age": 25,
    "department": "Engineering",
    "interests": ["coding", "ai"]
  }
}
```

### 응답 스키마

#### 성공 응답 (201 Created)

```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다.",
  "data": {
    "id": "user-uuid-here",
    "user_id": "johndoe",
    "name": "John Doe",
    "phone": "010-1234-5678",
    "is_reserved": false,
    "created_at": "2024-01-15T10:30:00Z",
    "project_id": "[PROJECT_ID]"
  }
}
```

#### 에러 응답

##### 422 Validation Error
```json
{
  "success": false,
  "message": "입력값이 올바르지 않습니다.",
  "detail": [
    {
      "field": "user_id",
      "message": "사용자 ID는 4-20자의 영문과 숫자만 가능합니다."
    }
  ]
}
```

##### 409 Conflict
```json
{
  "success": false,
  "errorCode": "USER_EXISTS",
  "message": "이미 사용 중인 사용자 ID입니다."
}
```

## 2. React 구현

### 기본 회원가입 컴포넌트

```tsx
import React, { useState } from 'react';
import axios from 'axios';

interface SignupFormProps {
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
  className?: string;
  projectId: string;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  onSuccess,
  onError,
  className = '',
  projectId
}) => {
  const [form, setForm] = useState({
    user_id: '',
    user_pw: '',
    name: '',
    phone: '',
    is_reserved: false
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // 사용자 ID 검증
    if (!form.user_id) {
      newErrors.user_id = '사용자 ID를 입력해주세요.';
    } else if (!/^[a-zA-Z0-9]{4,20}$/.test(form.user_id)) {
      newErrors.user_id = '사용자 ID는 4-20자의 영문과 숫자만 가능합니다.';
    }

    // 비밀번호 검증
    if (!form.user_pw) {
      newErrors.user_pw = '비밀번호를 입력해주세요.';
    } else if (form.user_pw.length < 8) {
      newErrors.user_pw = '비밀번호는 8자 이상이어야 합니다.';
    }

    // 이름 검증
    if (!form.name) {
      newErrors.name = '이름을 입력해주세요.';
    }

    // 전화번호 검증
    if (!form.phone) {
      newErrors.phone = '전화번호를 입력해주세요.';
    } else if (!/^010-\d{4}-\d{4}$/.test(form.phone)) {
      newErrors.phone = '전화번호는 010-1234-5678 형식으로 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const signupData = {
        ...form,
        project_id: projectId
      };

      const response = await axios.post('https://api.aiapp.link/account/signup', signupData, {
        withCredentials: true
      });

      if (response.data.success) {
        onSuccess?.(response.data.data);
      }
    } catch (err: any) {
      const apiError = err.response?.data;
      let errorMessage = '회원가입에 실패했습니다.';

      if (apiError?.errorCode) {
        switch (apiError.errorCode) {
          case 'USER_EXISTS':
            setErrors({ user_id: '이미 사용 중인 사용자 ID입니다.' });
            return;
          case 'VALIDATION_ERROR':
            // 서버 유효성 검사 오류 처리
            if (apiError.detail) {
              const fieldErrors: Record<string, string> = {};
              apiError.detail.forEach((error: any) => {
                fieldErrors[error.field] = error.message;
              });
              setErrors(fieldErrors);
              return;
            }
            break;
        }
        errorMessage = apiError.message || '회원가입에 실패했습니다.';
      }

      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`signup-form ${className}`}>
      <h2>회원가입</h2>

      <div className="form-group">
        <label htmlFor="user_id">
          사용자 ID <span className="required">*</span>
        </label>
        <input
          type="text"
          id="user_id"
          value={form.user_id}
          onChange={(e) => setForm({...form, user_id: e.target.value})}
          placeholder="영문과 숫자 4-20자"
          required
          disabled={loading}
          className={errors.user_id ? 'error' : ''}
        />
        {errors.user_id && <div className="field-error">{errors.user_id}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="user_pw">
          비밀번호 <span className="required">*</span>
        </label>
        <input
          type="password"
          id="user_pw"
          value={form.user_pw}
          onChange={(e) => setForm({...form, user_pw: e.target.value})}
          placeholder="8자 이상"
          required
          disabled={loading}
          className={errors.user_pw ? 'error' : ''}
        />
        {errors.user_pw && <div className="field-error">{errors.user_pw}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="name">
          이름 <span className="required">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={form.name}
          onChange={(e) => setForm({...form, name: e.target.value})}
          placeholder="실명을 입력하세요"
          required
          disabled={loading}
          className={errors.name ? 'error' : ''}
        />
        {errors.name && <div className="field-error">{errors.name}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="phone">
          전화번호 <span className="required">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          value={form.phone}
          onChange={(e) => setForm({...form, phone: e.target.value})}
          placeholder="010-1234-5678"
          required
          disabled={loading}
          className={errors.phone ? 'error' : ''}
        />
        {errors.phone && <div className="field-error">{errors.phone}</div>}
      </div>

      <div className="form-group">
        <label className="checkbox-group">
          <input
            type="checkbox"
            checked={form.is_reserved}
            onChange={(e) => setForm({...form, is_reserved: e.target.checked})}
            disabled={loading}
          />
          예약 계정으로 등록
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="submit-button"
      >
        {loading ? '가입 중...' : '회원가입'}
      </button>
    </form>
  );
};
```

### Tailwind CSS 스타일링 버전

```tsx
export const SignupFormTailwind: React.FC<SignupFormProps> = ({
  onSuccess,
  onError,
  projectId
}) => {
  // ... 상태 관리 및 로직 동일

  return (
    <div className="max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-2xl font-bold text-center mb-6">회원가입</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            사용자 ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.user_id}
            onChange={(e) => setForm({...form, user_id: e.target.value})}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.user_id ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="영문과 숫자 4-20자"
            required
          />
          {errors.user_id && (
            <p className="mt-1 text-sm text-red-600">{errors.user_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호 <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={form.user_pw}
            onChange={(e) => setForm({...form, user_pw: e.target.value})}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.user_pw ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="8자 이상"
            required
          />
          {errors.user_pw && (
            <p className="mt-1 text-sm text-red-600">{errors.user_pw}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="실명을 입력하세요"
            required
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            전화번호 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({...form, phone: e.target.value})}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="010-1234-5678"
            required
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_reserved"
            checked={form.is_reserved}
            onChange={(e) => setForm({...form, is_reserved: e.target.checked})}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="is_reserved" className="ml-2 block text-sm text-gray-900">
            예약 계정으로 등록
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {loading ? '가입 중...' : '회원가입'}
        </button>
      </form>
    </div>
  );
};
```

## 3. Vanilla JavaScript 구현

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

        .form-group input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 16px;
            box-sizing: border-box;
            transition: border-color 0.2s;
        }

        .form-group input:focus {
            outline: none;
            border-color: #28a745;
            box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25);
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

            <div class="form-group">
                <label for="user_id">사용자 ID <span class="required">*</span></label>
                <input
                    type="text"
                    id="user_id"
                    name="user_id"
                    placeholder="영문과 숫자 4-20자"
                    required
                >
                <div id="user_id_error" class="field-error"></div>
            </div>

            <div class="form-group">
                <label for="user_pw">비밀번호 <span class="required">*</span></label>
                <input
                    type="password"
                    id="user_pw"
                    name="user_pw"
                    placeholder="8자 이상"
                    required
                >
                <div id="user_pw_error" class="field-error"></div>
            </div>

            <div class="form-group">
                <label for="name">이름 <span class="required">*</span></label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="실명을 입력하세요"
                    required
                >
                <div id="name_error" class="field-error"></div>
            </div>

            <div class="form-group">
                <label for="phone">전화번호 <span class="required">*</span></label>
                <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="010-1234-5678"
                    required
                >
                <div id="phone_error" class="field-error"></div>
            </div>

            <div class="form-group">
                <div class="checkbox-group">
                    <input
                        type="checkbox"
                        id="is_reserved"
                        name="is_reserved"
                        value="true"
                    >
                    <label for="is_reserved">예약 계정으로 등록</label>
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
            PROJECT_ID: '[PROJECT_ID]'
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
                // 폼 제출 이벤트
                this.form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSubmit();
                });

                // 실시간 유효성 검사
                this.setupValidation();
            }

            setupValidation() {
                // 사용자 ID 유효성 검사
                document.getElementById('user_id').addEventListener('blur', (e) => {
                    this.validateUserId(e.target.value);
                });

                // 비밀번호 유효성 검사
                document.getElementById('user_pw').addEventListener('blur', (e) => {
                    this.validatePassword(e.target.value);
                });

                // 전화번호 유효성 검사
                document.getElementById('phone').addEventListener('blur', (e) => {
                    this.validatePhone(e.target.value);
                });
            }

            validateUserId(value) {
                const errorElement = document.getElementById('user_id_error');
                const inputElement = document.getElementById('user_id');

                if (!value) {
                    this.showFieldError('user_id', '사용자 ID를 입력해주세요.');
                    return false;
                } else if (!/^[a-zA-Z0-9]{4,20}$/.test(value)) {
                    this.showFieldError('user_id', '사용자 ID는 4-20자의 영문과 숫자만 가능합니다.');
                    return false;
                } else {
                    this.hideFieldError('user_id');
                    return true;
                }
            }

            validatePassword(value) {
                if (!value) {
                    this.showFieldError('user_pw', '비밀번호를 입력해주세요.');
                    return false;
                } else if (value.length < 8) {
                    this.showFieldError('user_pw', '비밀번호는 8자 이상이어야 합니다.');
                    return false;
                } else {
                    this.hideFieldError('user_pw');
                    return true;
                }
            }

            validatePhone(value) {
                if (!value) {
                    this.showFieldError('phone', '전화번호를 입력해주세요.');
                    return false;
                } else if (!/^010-\d{4}-\d{4}$/.test(value)) {
                    this.showFieldError('phone', '전화번호는 010-1234-5678 형식으로 입력해주세요.');
                    return false;
                } else {
                    this.hideFieldError('phone');
                    return true;
                }
            }

            async handleSubmit() {
                if (this.loading) return;

                // 전체 유효성 검사
                if (!this.validateForm()) return;

                this.setLoading(true);
                this.clearMessages();

                try {
                    const formData = new FormData(this.form);
                    const signupData = {
                        user_id: formData.get('user_id'),
                        user_pw: formData.get('user_pw'),
                        name: formData.get('name'),
                        phone: formData.get('phone'),
                        is_reserved: formData.get('is_reserved') === 'true',
                        project_id: CONFIG.PROJECT_ID
                    };

                    const response = await fetch(`${CONFIG.API_ENDPOINT}/account/signup`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(signupData),
                        credentials: 'include'
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        this.showMessage('회원가입이 완료되었습니다!', 'success');
                        this.form.reset();

                        // 회원가입 성공 후 처리
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 2000);
                    } else {
                        this.handleError(result);
                    }
                } catch (error) {
                    console.error('회원가입 실패:', error);
                    this.showMessage('네트워크 오류가 발생했습니다.', 'error');
                } finally {
                    this.setLoading(false);
                }
            }

            validateForm() {
                const userId = document.getElementById('user_id').value;
                const password = document.getElementById('user_pw').value;
                const name = document.getElementById('name').value;
                const phone = document.getElementById('phone').value;

                let isValid = true;

                if (!this.validateUserId(userId)) isValid = false;
                if (!this.validatePassword(password)) isValid = false;
                if (!name) {
                    this.showFieldError('name', '이름을 입력해주세요.');
                    isValid = false;
                }
                if (!this.validatePhone(phone)) isValid = false;

                return isValid;
            }

            handleError(errorData) {
                if (errorData.errorCode === 'USER_EXISTS') {
                    this.showFieldError('user_id', '이미 사용 중인 사용자 ID입니다.');
                } else if (errorData.errorCode === 'VALIDATION_ERROR' && errorData.detail) {
                    errorData.detail.forEach(error => {
                        this.showFieldError(error.field, error.message);
                    });
                } else {
                    this.showMessage(errorData.message || '회원가입에 실패했습니다.', 'error');
                }
            }

            showFieldError(fieldName, message) {
                const errorElement = document.getElementById(`${fieldName}_error`);
                const inputElement = document.getElementById(fieldName);

                if (errorElement && inputElement) {
                    errorElement.textContent = message;
                    errorElement.classList.add('show');
                    inputElement.classList.add('input-error');
                }
            }

            hideFieldError(fieldName) {
                const errorElement = document.getElementById(`${fieldName}_error`);
                const inputElement = document.getElementById(fieldName);

                if (errorElement && inputElement) {
                    errorElement.classList.remove('show');
                    inputElement.classList.remove('input-error');
                }
            }

            setLoading(isLoading) {
                this.loading = isLoading;
                this.submitButton.disabled = isLoading;
                this.submitButton.textContent = isLoading ? '가입 중...' : '회원가입';

                const inputs = this.form.querySelectorAll('input');
                inputs.forEach(input => {
                    input.disabled = isLoading;
                });
            }

            showMessage(message, type) {
                const messageClass = type === 'error' ? 'error-message' : 'success-message';
                this.messageContainer.innerHTML = `<div class="${messageClass}">${message}</div>`;
            }

            clearMessages() {
                this.messageContainer.innerHTML = '';
                // 모든 필드 에러도 제거
                const errorElements = document.querySelectorAll('.field-error');
                errorElements.forEach(element => {
                    element.classList.remove('show');
                });
                const inputElements = document.querySelectorAll('.input-error');
                inputElements.forEach(element => {
                    element.classList.remove('input-error');
                });
            }
        }

        // 회원가입 매니저 초기화
        document.addEventListener('DOMContentLoaded', () => {
            new SignupManager();
        });
    </script>
</body>
</html>
```

## 4. 유효성 검사

### 클라이언트 측 검사

- **사용자 ID**: 4-20자의 영문과 숫자만 허용
- **비밀번호**: 8자 이상
- **전화번호**: 010-1234-5678 형식
- **이름**: 필수 입력

### 서버 측 검사

서버에서 추가로 검증하는 항목:
- 사용자 ID 중복 검사
- 프로젝트 ID 유효성 검사
- 전화번호 형식 재검증

## 5. 보안 고려사항

1. **비밀번호 보안**: 클라이언트에서 평문으로 전송하지만 HTTPS로 보호
2. **Project ID**: 환경변수로 관리하여 노출 방지
3. **입력 검증**: 클라이언트와 서버 양쪽에서 검증
4. **HTTPS 필수**: 모든 회원가입 요청은 HTTPS 통신

## 6. 에러 처리

### 주요 에러 코드

| 에러 코드 | 설명 | 처리 방법 |
|-----------|------|-----------|
| `USER_EXISTS` | 중복된 사용자 ID | 다른 ID 사용 안내 |
| `VALIDATION_ERROR` | 입력값 유효성 오류 | 필드별 상세 오류 표시 |
| `PROJECT_NOT_FOUND` | 잘못된 Project ID | Project ID 확인 |

### 에러 처리 전략

1. **필드별 오류 표시**: 각 입력 필드에 해당하는 오류 메시지 표시
2. **실시간 검증**: 사용자가 입력하는 동안 유효성 검사
3. **사용자 친화적 메시지**: 기술적 오류를 이해하기 쉬운 언어로 변환

## 7. 관련 문서

- [로그인 구현 가이드](./login.md)
- [사용자 정보 조회 가이드](./user-info.md)
- [로그아웃 구현 가이드](./logout.md)
- [보안 설정 가이드](../common/security.md)
- [에러 처리 가이드](../common/errors.md)