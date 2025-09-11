# @mbaas/baas-mcp

AIApp BaaS 인증 시스템 MCP 서버

## 소개

`@mbaas/baas-mcp`는 AIApp BaaS 인증 시스템과의 연동을 위한 표준 입출력 기반 MCP(Model Context Protocol) 서버입니다.
이 서버는 LLM(대형 언어 모델)이 AIApp BaaS 공식 문서에서 키워드 기반으로 관련 정보를 탐색하고, 프레임워크별 클라이언트 코드를 자동 생성할 수 있도록 다양한 MCP 도구를 제공합니다.

[AIApp BaaS 개발자센터](https://docs.aiapp.link)

[BaaS 인증 API 가이드](https://docs.aiapp.link/api/auth)

## 설치

이 패키지는 Node.js 18+ 환경에서 동작합니다.

아래와 같이 설정하여 설치할 수 있습니다.

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

### Project ID 설정 (권장)

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

### `search-documents`

- **설명**: AIApp BaaS 인증 시스템 문서를 키워드 배열로 검색합니다.
- **파라미터**:
  - `keywords: string[]` — 검색할 키워드 배열 (권장)
  - `query: string` — 검색 문장 (폴백)

### `get-implementation-guide`

- **설명**: BaaS 인증 기능 구현 가이드를 키워드 배열로 검색합니다.
- **파라미터**:
  - `keywords: string[]` — 구현 키워드 배열
  - `feature: string` — 구현할 기능 (login|signup|info|logout)
  - `framework: string` — 사용할 프레임워크 (react|vue|nextjs|vanilla)

### `get-document-by-id`

- **설명**: 문서 ID로 특정 BaaS 인증 시스템 문서의 전체 내용을 조회합니다.
- **파라미터**:
  - `id: number` — 문서의 고유 ID

### `get-documents-by-category`

- **설명**: 카테고리별로 BaaS 인증 시스템 문서를 조회합니다.
- **파라미터**:
  - `category: string` — 문서 카테고리 (api|templates|security|examples|dev|frameworks|errors|config)

### `get-project-config`

- **설명**: 현재 MCP 서버에 설정된 프로젝트 ID를 확인합니다.
- **파라미터**: 없음

## 라이선스

MIT License

## 지원

- 📧 Email: mbaas.tech@gmail.com
- 🐛 버그 리포트: https://github.com/mbaas-inc/BaaS-MCP/issues

---

**Built with ❤️ by mBaaS Team**