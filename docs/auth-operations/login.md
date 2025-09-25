# 로그인 구현 가이드

AIApp BaaS 인증 시스템의 로그인 기능을 구현하기 위한 통합 가이드입니다. API 명세부터 React와 Vanilla JavaScript 구현 예제까지 모든 내용을 포함합니다.

## 1. API 명세

### 기본 정보

- **URL**: `/account/login`
- **Method**: `POST`
- **Base URL**: `https://api.aiapp.link`
- **Content-Type**: `application/json`
- **Description**: 사용자 인증 후 JWT 토큰을 발급하고 쿠키를 설정합니다.

### 요청 스키마

#### 필수 필드

```json
{
  "user_id": "string",      // 사용자 ID
  "user_pw": "string",      // 비밀번호 (8자리 이상)
  "project_id": "string"    // 프로젝트 ID (UUID) - 필수
}
```

#### 요청 예시

```json
{
  "user_id": "johndoe",
  "user_pw": "password123",
  "project_id": "[PROJECT_ID]"
}
```

### 응답 스키마

#### 성공 응답 (200 OK)

```json
{
  "success": true,
  "message": "로그인 완료",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
  }
}
```

**쿠키 자동 설정**:
서버에서 자동으로 `access_token` 쿠키를 설정합니다.
- **key**: `access_token`
- **domain**: `.aiapp.link` (서브도메인 공유)
- **httpOnly**: `true` (JavaScript 접근 차단)
- **secure**: `true` (HTTPS만 전송)
- **sameSite**: `None` (크로스 도메인 허용)
- **maxAge**: `86400` (1일)
- **path**: `/`

#### 에러 응답

##### 400 Bad Request
```json
{
  "errorCode": "INVALID_USER",
  "message": "사용자 정보가 올바르지 않습니다"
}
```

##### 422 Validation Error
```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "요청 값이 올바르지 않습니다.",
  "detail": [
    {
      "field": "user_pw",
      "message": "비밀번호는 8자리 이상이어야 합니다"
    }
  ]
}
```

## 2. React 구현

### 기본 로그인 컴포넌트

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

      const response = await axios.post('https://api.aiapp.link/account/login', loginData, {
        withCredentials: true
      });

      if (response.data.success) {
        onSuccess?.(response.data.data);
      }
    } catch (err: any) {
      // BaaS API 에러 구조: { errorCode, message, detail }
      const apiError = err.response?.data;
      let errorMessage = '로그인에 실패했습니다.';

      if (apiError?.errorCode) {
        switch (apiError.errorCode) {
          case 'INVALID_USER':
          case 'USER_NOT_FOUND':
            errorMessage = '아이디 또는 비밀번호가 올바르지 않습니다.';
            break;
          case 'VALIDATION_ERROR':
            errorMessage = apiError.detail?.[0]?.message || '입력값을 확인해주세요.';
            break;
          case 'UNAUTHORIZED':
            errorMessage = 'project_id가 없거나 올바르지 않습니다.';
            break;
          default:
            errorMessage = apiError.message || '로그인에 실패했습니다.';
        }
      }

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

### Tailwind CSS 스타일링 버전

```tsx
export const LoginFormTailwind: React.FC<LoginFormProps> = ({
  onSuccess,
  onError,
  projectId
}) => {
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
          className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {loading ? '로그인 중...' : '로그인'}
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

                    const response = await fetch(`${CONFIG.API_ENDPOINT}/account/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(loginData),
                        credentials: 'include' // 쿠키 자동 관리
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        this.showMessage('로그인 성공!', 'success');

                        // 로그인 성공 후 처리
                        setTimeout(() => {
                            // 페이지 이동 또는 상태 업데이트
                            window.location.href = '/dashboard';
                        }, 1000);
                    } else {
                        this.handleError(result);
                    }
                } catch (error) {
                    console.error('로그인 실패:', error);
                    this.showMessage('네트워크 오류가 발생했습니다.', 'error');
                } finally {
                    this.setLoading(false);
                }
            }

            handleError(errorData) {
                let errorMessage = '로그인에 실패했습니다.';

                if (errorData.errorCode) {
                    switch (errorData.errorCode) {
                        case 'INVALID_USER':
                        case 'USER_NOT_FOUND':
                            errorMessage = '아이디 또는 비밀번호가 올바르지 않습니다.';
                            break;
                        case 'VALIDATION_ERROR':
                            errorMessage = errorData.detail?.[0]?.message || '입력값을 확인해주세요.';
                            break;
                        case 'UNAUTHORIZED':
                            errorMessage = 'project_id가 없거나 올바르지 않습니다.';
                            break;
                        default:
                            errorMessage = errorData.message || '로그인에 실패했습니다.';
                    }
                }

                this.showMessage(errorMessage, 'error');
            }

            setLoading(isLoading) {
                this.loading = isLoading;
                this.submitButton.disabled = isLoading;
                this.submitButton.textContent = isLoading ? '로그인 중...' : '로그인';

                // 폼 필드들 disabled 처리
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
            }
        }

        // 로그인 매니저 초기화
        document.addEventListener('DOMContentLoaded', () => {
            new LoginManager();
        });
    </script>
</body>
</html>
```

## 4. 보안 및 쿠키 설정

### 쿠키 보안 설정

AIApp BaaS는 로그인 성공 시 자동으로 보안 쿠키를 설정합니다:

- **httpOnly**: JavaScript 접근 차단으로 XSS 공격 방지
- **secure**: HTTPS에서만 전송
- **sameSite**: `None`으로 설정하여 크로스 도메인 허용
- **domain**: `.aiapp.link`로 서브도메인 간 공유
- **maxAge**: 1일 (86400초)

### CORS 설정

모든 API 요청에는 다음이 필요합니다:

**React (axios):**
```javascript
withCredentials: true
```

**Vanilla JavaScript (fetch):**
```javascript
credentials: 'include'
```

### 보안 고려사항

1. **HTTPS 필수**: 모든 로그인 요청은 HTTPS를 통해 전송
2. **Project ID 보호**: Project ID는 서버에서 관리하고, 클라이언트에서는 환경변수로 처리
3. **토큰 만료**: JWT 토큰은 1일 후 자동 만료
4. **에러 처리**: 상세한 에러 정보 노출 방지

## 5. 에러 처리

### 주요 에러 코드

| 에러 코드 | 설명 | 처리 방법 |
|-----------|------|-----------|
| `INVALID_USER` | 잘못된 사용자 정보 | 아이디/비밀번호 확인 안내 |
| `VALIDATION_ERROR` | 입력값 유효성 오류 | 상세 오류 메시지 표시 |
| `UNAUTHORIZED` | 권한 없음 (project_id 오류) | Project ID 확인 |
| `INTERNAL_SERVER_ERROR` | 서버 오류 | 잠시 후 다시 시도 안내 |

### 에러 처리 전략

1. **사용자 친화적 메시지**: 기술적 에러를 사용자가 이해하기 쉬운 메시지로 변환
2. **입력값 검증**: 클라이언트에서 기본 검증 후 서버 검증
3. **재시도 메커니즘**: 네트워크 오류 시 자동 또는 수동 재시도 옵션 제공

## 6. 관련 문서

- [회원가입 구현 가이드](./signup.md)
- [사용자 정보 조회 가이드](./user-info.md)
- [로그아웃 구현 가이드](./logout.md)
- [보안 설정 가이드](../common/security.md)
- [에러 처리 가이드](../common/errors.md)