# 회원가입 구현 가이드

AIApp BaaS 인증 시스템의 회원가입 기능을 구현하기 위한 핵심 가이드입니다.

**Keywords**: signup, 회원가입, register, validation, user creation, form, 사용자등록, HTML, JavaScript, Vanilla, vanilla
**Focus**: 회원가입 API 구현, 유효성 검사, HTML/Vanilla JavaScript/React 예제

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
  "project_id": "string"    // 프로젝트 ID (UUID) - 필수
}
```

#### 선택 필드

```json
{
  "is_reserved": boolean,   // 예약 계정 여부 (기본값: false)
  "data": {                 // 커스텀 데이터 필드
    "age": 25,
    "interests": ["coding", "music"],
    "company": "Example Corp"
  }
}
```

### 요청 예시

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
    "department": "Engineering"
  }
}
```

### 응답 스키마

#### 성공 응답 (201 Created)

```json
{
  "result": "SUCCESS",
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
  "result": "FAIL",
  "errorCode": "VALIDATION_ERROR",
  "message": "요청 값이 올바르지 않습니다.",
  "detail": [
    {
      "field": "user_id",
      "reason": "이미 사용 중인 사용자 ID입니다"
    }
  ]
}
```

##### 409 Conflict
```json
{
  "result": "FAIL",
  "errorCode": "USER_EXISTS",
  "message": "이미 존재하는 사용자입니다"
}
```

## 2. React 구현

### 핵심 회원가입 구현

```tsx
import React, { useState } from 'react';

const SignupForm = ({ onSuccess, projectId }) => {
  const [formData, setFormData] = useState({
    user_id: '',
    user_pw: '',
    name: '',
    phone: '',
    is_reserved: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.user_id || formData.user_id.length < 4) {
      newErrors.user_id = '사용자 ID는 4자 이상이어야 합니다';
    }
    if (!formData.user_pw || formData.user_pw.length < 8) {
      newErrors.user_pw = '비밀번호는 8자 이상이어야 합니다';
    }
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }
    if (!formData.phone || !/^010-\d{4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다 (010-1234-5678)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('https://api.aiapp.link/account/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, project_id: projectId })
      });

      const result = await response.json();

      if (result.result === 'SUCCESS') {
        onSuccess?.(result.data);
      } else {
        // 서버 에러를 필드별로 매핑
        if (result.detail) {
          const serverErrors = {};
          result.detail.forEach(error => {
            serverErrors[error.field] = error.reason;
          });
          setErrors(serverErrors);
        } else {
          setErrors({ general: result.message || '회원가입에 실패했습니다' });
        }
      }
    } catch (err) {
      setErrors({ general: '네트워크 오류가 발생했습니다' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 필드 수정 시 해당 에러 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="text"
          placeholder="사용자 ID (4-20자)"
          value={formData.user_id}
          onChange={(e) => handleChange('user_id', e.target.value)}
          required
        />
        {errors.user_id && <span className="error">{errors.user_id}</span>}
      </div>

      <div>
        <input
          type="password"
          placeholder="비밀번호 (8자 이상)"
          value={formData.user_pw}
          onChange={(e) => handleChange('user_pw', e.target.value)}
          required
        />
        {errors.user_pw && <span className="error">{errors.user_pw}</span>}
      </div>

      <div>
        <input
          type="text"
          placeholder="이름"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>

      <div>
        <input
          type="tel"
          placeholder="전화번호 (010-1234-5678)"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          required
        />
        {errors.phone && <span className="error">{errors.phone}</span>}
      </div>

      {errors.general && <div className="error">{errors.general}</div>}

      <button type="submit" disabled={loading}>
        {loading ? '가입 중...' : '회원가입'}
      </button>
    </form>
  );
};
```

## 3. Vanilla JavaScript 구현

### 핵심 회원가입 기능

```javascript
class SignupManager {
  constructor(projectId) {
    this.projectId = projectId;
    this.loading = false;
  }

  validateForm(formData) {
    const errors = {};

    if (!formData.user_id || formData.user_id.length < 4) {
      errors.user_id = '사용자 ID는 4자 이상이어야 합니다';
    }
    if (!formData.user_pw || formData.user_pw.length < 8) {
      errors.user_pw = '비밀번호는 8자 이상이어야 합니다';
    }
    if (!formData.name || !formData.name.trim()) {
      errors.name = '이름을 입력해주세요';
    }
    if (!formData.phone || !/^010-\d{4}-\d{4}$/.test(formData.phone)) {
      errors.phone = '올바른 전화번호 형식이 아닙니다 (010-1234-5678)';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  async signup(formData) {
    if (this.loading) return;

    const validation = this.validateForm(formData);
    if (!validation.isValid) {
      this.onValidationError(validation.errors);
      return;
    }

    this.loading = true;
    try {
      const response = await fetch('https://api.aiapp.link/account/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          project_id: this.projectId
        })
      });

      const result = await response.json();

      if (result.result === 'SUCCESS') {
        this.onSignupSuccess(result.data);
        return result.data;
      } else {
        throw new Error(result.message || '회원가입 실패');
      }
    } catch (error) {
      this.onSignupError(error);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  onSignupSuccess(data) {
    console.log('회원가입 성공:', data);
    alert('회원가입이 완료되었습니다!');
    window.location.href = '/login';
  }

  onSignupError(error) {
    console.error('회원가입 실패:', error);
    alert(error.message);
  }

  onValidationError(errors) {
    console.log('유효성 검사 실패:', errors);
    // 에러 메시지 표시
    Object.keys(errors).forEach(field => {
      const errorElement = document.getElementById(`${field}_error`);
      if (errorElement) {
        errorElement.textContent = errors[field];
        errorElement.style.display = 'block';
      }
    });
  }
}

// 사용 예시
const signupManager = new SignupManager('[PROJECT_ID]');

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const signupData = {
    user_id: formData.get('user_id'),
    user_pw: formData.get('user_pw'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    is_reserved: formData.get('is_reserved') === 'on'
  };

  try {
    await signupManager.signup(signupData);
  } catch (error) {
    // 에러는 이미 처리됨
  }
});
```

## 4. 유효성 검사 규칙

### 클라이언트 검증
- **user_id**: 4-20자, 영문/숫자만 허용
- **user_pw**: 8자 이상
- **name**: 필수 입력, 공백 불가
- **phone**: 010-1234-5678 형식
- **is_reserved**: boolean 값 (선택사항, 기본값: false)

### 서버 검증
모든 클라이언트 검증 + 추가 검증:
- 중복 사용자 ID 확인
- project_id 유효성 확인
- 데이터베이스 제약사항 검증

## 5. 자동 적용 보안 설정

이 API는 다음 보안 설정이 자동으로 적용됩니다:

- ✅ **입력값 검증**: SQL Injection, XSS 방지
- ✅ **비밀번호 해싱**: 평문 저장 금지
- ✅ **프로젝트 격리**: project_id 기반 멀티테넌트
- ✅ **중복 방지**: 사용자 ID 유일성 보장

상세 보안 설정: [보안 가이드](../common/security.md)

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

### 구현 시 필수 참조 문서
다음 문서들을 함께 참조하여 보안과 상태 관리를 올바르게 구현하세요:

- [상태 관리 가이드](../common/state-management.md) - 회원가입 후 로그인 상태 전환, 조건부 렌더링
- [보안 가이드](../common/security.md) - HttpOnly 쿠키, CORS, XSS/CSRF 방지, 입력값 검증
- [에러 처리 가이드](../common/errors.md) - ServiceException 처리 패턴, 유효성 검사 오류

### 관련 API 구현 문서
- [로그인 구현 가이드](./login.md)
- [사용자 정보 조회 가이드](./user-info.md)
- [로그아웃 구현 가이드](./logout.md)