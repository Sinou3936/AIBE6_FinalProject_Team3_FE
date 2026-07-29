import { NextRequest, NextResponse } from 'next/server';
import { refreshSession } from '../../lib/api/http';

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const DEFAULT_NEXT_PATH = '/home';

// proxy.ts의 matcher와 동일한 보호 경로 목록 — 둘 중 하나가 바뀌면 같이 갱신할 것.
// (main)/layout.tsx는 이 프리픽스들 아래에서만 쓰이므로 next 값도 이 범위로 제한한다.
const ALLOWED_NEXT_PREFIXES = ['/home', '/properties', '/checklist', '/checklists', '/contract', '/mypage'];

// 외부에서 그대로 들어오는 쿼리 파라미터라 오픈 리다이렉트 방지가 필요하다 — 절대 URL(http://...),
// 프로토콜 상대 URL(//evil.com), 허용 프리픽스 밖의 경로는 전부 기본 경로로 대체한다.
function sanitizeNextPath(rawNext: string | null): string {
  if (!rawNext) {
    return DEFAULT_NEXT_PATH;
  }
  const isAllowed = ALLOWED_NEXT_PREFIXES.some(
    (prefix) => rawNext === prefix || rawNext.startsWith(`${prefix}/`) || rawNext.startsWith(`${prefix}?`),
  );
  return isAllowed ? rawNext : DEFAULT_NEXT_PATH;
}

const ACCESS_TOKEN_COOKIE = 'access_token';

// (main)/layout.tsx가 GET /auth/me에서 401을 받았을 때 곧장 /login으로 보내는 대신 여기로 온다 —
// access_token 쿠키가 있어도 무효(로그아웃으로 블랙리스트에 오름 등)일 수 있는데, refresh_token은
// 아직 살아있을 수 있어서다. Server Component(layout.tsx)는 쿠키를 쓸 수 없으므로, 실제로 refresh를
// 시도하고 그 결과 쿠키를 Set-Cookie로 반영하는 건 Route Handler인 여기서만 할 수 있다.
export async function GET(request: NextRequest) {
  const next = sanitizeNextPath(request.nextUrl.searchParams.get('next'));
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  let refreshOutcomeStatus: 'rejected' | 'unreachable' | undefined;
  if (refreshToken) {
    const outcome = await refreshSession(refreshToken);
    if (outcome.status === 'success') {
      const response = NextResponse.redirect(new URL(next, request.url));
      outcome.cookies.forEach((cookie) => response.headers.append('Set-Cookie', cookie));
      return response;
    }
    // proxy.ts와 동일한 구분 — 'rejected'(진짜 무효)일 때만 쿠키를 지운다. 'unreachable'(네트워크
    // 오류 등)까지 지우면 백엔드가 잠깐 응답 안 했을 뿐인 멀쩡한 세션까지 로그아웃시켜버린다.
    refreshOutcomeStatus = outcome.status;
  }

  // 여기서 쿠키를 지우지 않으면 proxy.ts가 (무효해진) access_token 쿠키의 "존재 여부"만 보고
  // 통과시켜서, 다음 방문 때마다 이 세션 복구 흐름을 헛되이 반복하게 된다.
  //
  // 'unreachable'이면 세션이 실제로 만료된 게 아니라 백엔드/네트워크가 잠깐 불안정했을 뿐일 수
  // 있으므로, "다시 로그인하세요"(session_expired) 대신 "잠시 후 다시 시도하세요"(session_unavailable)
  // 문구로 구분한다. refreshToken 자체가 아예 없었던 경우(진짜 세션 없음)는 여전히 session_expired.
  // 이때 원래 가려던 next도 같이 넘겨서, 로그인 화면의 "다시 시도" 링크가 이 경로로 다시
  // /auth/session-recover를 태울 수 있게 한다.
  const loginPath =
    refreshOutcomeStatus === 'unreachable'
      ? `/login?error=session_unavailable&next=${encodeURIComponent(next)}`
      : '/login?error=session_expired';
  const response = NextResponse.redirect(new URL(loginPath, request.url));
  if (refreshOutcomeStatus === 'rejected') {
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
  }
  return response;
}
