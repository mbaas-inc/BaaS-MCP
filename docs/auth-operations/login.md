# 로그인 구현 가이드

AIApp BaaS 인증 시스템의 로그인 기능을 구현하기 위한 핵심 가이드입니다.

**Keywords**: login, 로그인, signin, authenticate, jwt, token, credentials, 인증
**Focus**: 로그인 API 구현, 자동 쿠키 설정, React/JavaScript 예제

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

### 핵심 로그인 구현

```tsx
import React, { useState } from 'react';

const LoginForm = ({ onSuccess, projectId }) => {
  const [credentials, setCredentials] = useState({ user_id: '', user_pw: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://api.aiapp.link/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 중요: 쿠키 자동 설정
        body: JSON.stringify({ ...credentials, project_id: projectId })
      });

      const result = await response.json();

      if (result.success) {
        onSuccess?.(result.data);
      } else {
        setError(result.message || '로그인 실패');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        placeholder="사용자 ID"
        value={credentials.user_id}
        onChange={(e) => setCredentials(prev => ({ ...prev, user_id: e.target.value }))}
        required
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={credentials.user_pw}
        onChange={(e) => setCredentials(prev => ({ ...prev, user_pw: e.target.value }))}
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
};
```

## 3. Vanilla JavaScript 구현

### 핵심 로그인 기능

```javascript
class LoginManager {
  constructor(projectId) {
    this.projectId = projectId;
    this.loading = false;
  }

  async login(credentials) {
    if (this.loading) return;

    this.loading = true;
    try {
      const response = await fetch('https://api.aiapp.link/account/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 중요: 쿠키 자동 설정
        body: JSON.stringify({
          ...credentials,
          project_id: this.projectId
        })
      });

      const result = await response.json();

      if (result.success) {
        // 로그인 성공 처리
        this.onLoginSuccess(result.data);
        return result.data;
      } else {
        throw new Error(result.message || '로그인 실패');
      }
    } catch (error) {
      this.onLoginError(error);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  onLoginSuccess(data) {
    // 로그인 성공 후 처리 (예: 페이지 이동)
    console.log('로그인 성공:', data);
    window.location.href = '/dashboard';
  }

  onLoginError(error) {
    // 에러 처리
    console.error('로그인 실패:', error);
    alert(error.message);
  }
}

// 사용 예시
const loginManager = new LoginManager('[PROJECT_ID]');

// 폼 이벤트 처리
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
    // 에러는 이미 처리됨
  }
});
```

## 4. 자동 적용 보안 설정

이 API는 다음 보안 설정이 자동으로 적용됩니다:

- ✅ **HttpOnly 쿠키**: JavaScript 접근 차단으로 XSS 방지
- ✅ **credentials: 'include'**: 쿠키 자동 포함 및 설정
- ✅ **CORS 자동 처리**: 서브도메인 간 쿠키 공유
- ✅ **토큰 자동 관리**: 만료 시 자동 로그아웃

상세 보안 설정: [보안 가이드](../common/security.md)

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

### 구현 시 필수 참조 문서
다음 문서들을 함께 참조하여 보안과 상태 관리를 올바르게 구현하세요:

- [상태 관리 가이드](../common/state-management.md) - 로그인 상태 UI 제어, 조건부 렌더링, CSS display 사용 금지
- [보안 가이드](../common/security.md) - HttpOnly 쿠키, CORS, XSS/CSRF 방지, 서브도메인 쿠키 공유
- [에러 처리 가이드](../common/errors.md) - ServiceException 처리 패턴, 디버깅 도구

### 관련 API 구현 문서
- [회원가입 구현 가이드](./signup.md)
- [사용자 정보 조회 가이드](./user-info.md)
- [로그아웃 구현 가이드](./logout.md)