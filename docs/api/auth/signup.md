# 회원가입 API

AIApp BaaS 인증 시스템의 회원가입 API 명세서입니다.

## 기본 정보

- **URL**: `/account/signup`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Description**: 새로운 사용자 계정을 생성합니다. 각 프로젝트는 독립적인 사용자 관리를 위해 project_id가 필수입니다.

## 요청 스키마

### 필수 필드

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

### 선택 필드

```json
{
  "data": {                 // 커스텀 데이터 필드
    "age": 25,
    "interests": ["coding", "music"],
    "company": "Example Corp"
  }
}
```

## 요청 예시

### 기본 회원가입

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

### 커스텀 데이터 포함 회원가입

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

## 응답 스키마

### 성공 응답 (201 Created)

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

### 에러 응답

#### 422 Validation Error
```json
{
  "success": false,
  "message": "입력값이 올바르지 않습니다.",
  "detail": [
    {
      "loc": ["body", "user_pw"],
      "msg": "비밀번호는 최소 8자 이상이어야 합니다.",
      "type": "value_error"
    }
  ]
}
```

#### 409 Conflict (중복 사용자)
```json
{
  "success": false,
  "message": "이미 사용 중인 아이디입니다.",
  "error_code": "USER_ALREADY_EXISTS"
}
```

## 구현 예제

### JavaScript/Fetch

```javascript
const signup = async (userData) => {
  try {
    const response = await fetch('https://api.aiapp.link/account/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 쿠키 포함
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('회원가입 실패:', error);
    throw error;
  }
};
```

### React Hook

```typescript
import { useState } from 'react';
import axios from 'axios';

interface SignupData {
  user_id: string;
  user_pw: string;
  name: string;
  phone: string;
  is_reserved: boolean;
  project_id?: string;
  data?: Record<string, any>;
}

export const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = async (data: SignupData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/signup', data, {
        withCredentials: true
      });
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.status === 422 
        ? '입력값을 확인해주세요.'
        : err.response?.status === 409
        ? '이미 사용 중인 아이디입니다.'
        : '회원가입에 실패했습니다.';
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { signup, loading, error };
};
```

## 유효성 검증

### 클라이언트 사이드 검증

```javascript
const validateSignupData = (data) => {
  const errors = {};

  // 사용자 ID 검증
  if (!data.user_id || data.user_id.length < 4 || data.user_id.length > 20) {
    errors.user_id = '사용자 ID는 4-20자 사이여야 합니다.';
  }

  // 비밀번호 검증
  if (!data.user_pw || data.user_pw.length < 8) {
    errors.user_pw = '비밀번호는 최소 8자 이상이어야 합니다.';
  }

  // 이름 검증
  if (!data.name || data.name.trim().length === 0) {
    errors.name = '이름을 입력해주세요.';
  }

  // 전화번호 검증
  const phoneRegex = /^010-\d{4}-\d{4}$/;
  if (!data.phone || !phoneRegex.test(data.phone)) {
    errors.phone = '올바른 전화번호 형식을 입력해주세요. (010-1234-5678)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

## 보안 고려사항

1. **비밀번호 강도**: 최소 8자 이상, 영문/숫자/특수문자 조합 권장
2. **입력 검증**: 모든 입력값에 대한 서버사이드 검증 필수
3. **중복 검사**: 사용자 ID 및 이메일 중복 검사
4. **Rate Limiting**: 무차별 대입 공격 방지를 위한 요청 제한
5. **HTTPS**: 모든 통신은 HTTPS를 통해 암호화

## 관련 문서

- [로그인 API](../login.md)
- [사용자 정보 조회 API](../info.md)
- [쿠키 설정 가이드](../../security/cookies.md)
- [에러 처리 가이드](../../dev/error-handling.md)