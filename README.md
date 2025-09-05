# @mbaas/baas-mcp
AIApp BaaS 인증 시스템 MCP 서버

## 소개
@mbaas/baas-mcp는 AIApp BaaS 인증 시스템과의 연동을 위한 표준 입출력 기반 MCP(Model Context Protocol) 서버입니다. 이 서버는 LLM(대형 언어 모델)이 운영 중인 BaaS 인증 API에서 키워드 기반으로 관련 정보를 탐색하고, 프레임워크별 클라이언트 코드를 자동 생성할 수 있도록 다양한 MCP 도구를 제공합니다.

📚 [상세 가이드 보기](GUIDE.md)

🛠️ [문제 해결 가이드](TROUBLESHOOTING.md)

👩‍💻 [개발자 가이드](DEVELOPMENT.md)

## 설치
이 패키지는 Node.js 18+ 환경에서 동작합니다.

Claude Desktop의 설정 파일에 추가하세요:

### 기본 설정
```json
{
  "mcpServers": {
    "baas-mcp": {
      "command": "npx",
      "args": ["-y", "@mbaas/baas-mcp@latest"]
    }
  }
}
```

### Project ID 자동 설정 (권장)
```json
{
  "mcpServers": {
    "baas-mcp": {
      "command": "npx", 
      "args": [
        "-y", 
        "@mbaas/baas-mcp@latest", 
        "--project-id=your-actual-project-id"
      ]
    }
  }
}
```

## 도구 목록

### search-documents
설명: AIApp BaaS 인증 시스템 문서를 키워드로 검색합니다.
파라미터:
- query: string — 검색할 키워드
- category?: string — 카테고리 필터 ("api" | "templates" | "security" | "examples")
- limit?: number — 결과 수 (기본값: 5)

### get-document-by-id
설명: 특정 문서의 전체 내용을 조회합니다.
파라미터:
- id: number — 문서의 고유 ID
- includeMetadata?: boolean — 메타데이터 포함 여부 (기본값: false)

### get-documents-by-category
설명: 카테고리별로 문서 목록을 조회합니다.
파라미터:
- category: string — "api" | "templates" | "security" | "examples"

### get-project-config
설명: 현재 MCP 서버에 설정된 프로젝트 ID를 확인합니다.
파라미터: 없음

## 빠른 시작

Claude에서 다음과 같이 요청해보세요:

```
"React에서 AIApp 로그인 폼을 만들어줘. TypeScript와 Tailwind CSS 사용해서"
```

MCP 서버가 자동으로:
1. ✅ 운영 중인 API 규격 확인
2. ✅ React 연동 템플릿 선택  
3. ✅ TypeScript 타입 추가
4. ✅ **Project ID 자동 주입** (설정된 경우)
5. ✅ Tailwind CSS 스타일 적용
6. ✅ 에러 처리 로직 포함
7. ✅ 즉시 사용 가능한 클라이언트 코드 제공

## API 엔드포인트

운영 중인 AIApp BaaS 인증 API:
- **Base URL**: https://api.aiapp.link
- **회원가입**: POST /signup
- **로그인**: POST /login  
- **사용자 정보**: GET /info

## 지원 프레임워크

- **React**: 컴포넌트, 훅, Context
- **Next.js**: 미들웨어, API 라우트  
- **Vue**: 컴포넌트, Composable
- **Vanilla JS**: HTML/JS, jQuery 예제

## 라이선스

MIT License

## 지원

- 📧 Email: mbaas.tech@gmail.com
- 🐛 버그 리포트: https://github.com/aiapp/baas-mcp/issues

---

**Built with ❤️ by mBaaS Team**