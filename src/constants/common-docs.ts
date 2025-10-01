/**
 * Common 문서 URL 상수
 *
 * BaaS 인증 시스템의 필수 구현 규칙 문서들입니다.
 * 이 문서들은 llms.txt에 포함되지 않고 별도로 로드됩니다.
 *
 * 보안상의 이유로:
 * - 외부에 공개적으로 노출되지 않음
 * - get-project-config를 통해서만 제공됨
 */
export const COMMON_DOCS_URLS = [
  'https://docs.aiapp.link/common/security.md',
  'https://docs.aiapp.link/common/errors.md',
  'https://docs.aiapp.link/common/state-management.md'
] as const;

/**
 * Common 문서 타입
 */
export type CommonDocUrl = typeof COMMON_DOCS_URLS[number];