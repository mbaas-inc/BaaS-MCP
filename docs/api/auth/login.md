# 로그인 API

AIApp BaaS 인증 시스템의 로그인 API 명세서입니다.

## 기본 정보

- **URL**: `/account/login`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Description**: 사용자 인증 후 JWT 토큰을 발급하고 쿠키를 설정합니다.

## 요청 스키마

### 필수 필드

```json
{
  "user_id": "string",      // 사용자 ID
  "user_pw": "string",      // 비밀번호 (8자리 이상)
  "project_id": "string"    // 프로젝트 ID (UUID) - 필수
}
```

## 요청 예시

```json
{
  "user_id": "johndoe",
  "user_pw": "password123",
  "project_id": "[PROJECT_ID]"
}
```

## 응답 스키마

### 성공 응답 (200 OK)

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

### 에러 응답

#### 400 Bad Request
```json
{
  "errorCode": "INVALID_USER",
  "message": "사용자 정보가 올바르지 않습니다"
}
```

#### 422 Validation Error
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

#### 500 Internal Server Error
```json
{
  "errorCode": "INTERNAL_SERVER_ERROR",
  "message": "예기치 못한 오류가 발생했습니다"
}
```

## 구현 예제

### JavaScript/Fetch

```javascript
const login = async (credentials) => {
  try {
    const response = await fetch('https://api.aiapp.link/account/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include' // 쿠키 자동 관리
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '로그인 실패');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('로그인 실패:', error);
    throw error;
  }
};
```

### 사용법

```javascript
// 로그인 요청
const credentials = {
  user_id: 'johndoe',
  user_pw: 'password123',
  project_id: '[PROJECT_ID]'
};

login(credentials)
  .then(result => {
    console.log('로그인 성공:', result);
    // 페이지 이동 또는 상태 업데이트
  })
  .catch(error => {
    console.error('로그인 실패:', error);
    // 에러 메시지 표시
  });
```

## 보안 고려사항

1. **HTTPS 통신**: 모든 로그인 요청은 HTTPS를 통해 전송
2. **쿠키 보안**: HttpOnly, Secure, SameSite 속성으로 보안 강화
3. **토큰 만료**: JWT 토큰의 적절한 만료 시간 설정 (1일)
4. **크로스 도메인**: `.aiapp.link` 도메인에서 서브도메인 간 쿠키 공유

## 관련 문서

- [회원가입 API](./signup.md)
- [사용자 정보 조회 API](./info.md)
- [로그아웃 API](./logout.md)
- [쿠키 설정 가이드](../../security/cookies.md)