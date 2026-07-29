const DEFAULT_NEXT_PATH = '/home';

// proxy.ts의 matcher와 동일한 보호 경로 목록 — 셋 중 하나가 바뀌면 같이 갱신할 것.
// (main)/layout.tsx는 이 프리픽스들 아래에서만 쓰이므로 next 값도 이 범위로 제한한다.
const ALLOWED_NEXT_PREFIXES = ['/home', '/properties', '/checklist', '/checklists', '/contract', '/mypage'];

// 로그인/세션 복구 흐름 전반에서 "돌아갈 경로"로 쓰이는 next 파라미터는 전부 외부에서 그대로 들어올
// 수 있어(쿼리스트링, 쿠키) 오픈 리다이렉트 방지가 필요하다 — 절대 URL(http://...), 프로토콜 상대
// URL(//evil.com), 허용 프리픽스 밖의 경로는 전부 기본 경로로 대체한다.
export function sanitizeNextPath(rawNext: string | null | undefined): string {
  if (!rawNext) {
    return DEFAULT_NEXT_PATH;
  }
  const isAllowed = ALLOWED_NEXT_PREFIXES.some(
    (prefix) => rawNext === prefix || rawNext.startsWith(`${prefix}/`) || rawNext.startsWith(`${prefix}?`),
  );
  return isAllowed ? rawNext : DEFAULT_NEXT_PATH;
}
