import { NextRequest, NextResponse } from 'next/server';
import { useMockData } from './app/config/dataSource';
import { mergeCookieHeader, refreshSession } from './app/lib/api/http';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

// access_token 쿠키는 httpOnly라 여기서 값을 읽어 검증할 순 없지만, 존재 여부는 확인할 수 있다.
// 실제 유효성 검증(서명/만료)은 백엔드가 각 API 호출마다 수행하므로, 여기서는
// "로그인 안 한 사용자를 로그인 화면으로 안내"하는 UX 목적의 가벼운 체크로 충분하다.
export async function proxy(request: NextRequest) {
  // mock 모드는 백엔드가 없어도 화면을 확인할 수 있어야 하므로 로그인 게이트를 건너뛴다.
  if (useMockData) {
    return NextResponse.next();
  }

  if (request.cookies.has(ACCESS_TOKEN_COOKIE)) {
    return NextResponse.next();
  }

  // access_token은 Max-Age가 지나면 브라우저가 알아서 지우므로, 쿠키가 없다는 사실만으로는
  // "로그인한 적 없음"과 "Access Token만 만료됨"을 구분할 수 없다. refresh_token이 남아있다면
  // 여기서 재발급을 시도해, 세션이 아직 유효한 사용자를 로그인 화면으로 돌려보내지 않는다.
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  let refreshWasRejected = false;
  if (refreshToken) {
    const outcome = await refreshSession(refreshToken);
    if (outcome.status === 'success') {
      // Set-Cookie는 브라우저의 "다음" 요청부터만 적용된다. 지금 이 요청에 이어지는
      // 서버 컴포넌트(layout 등)가 cookies()로 읽는 건 여전히 원래 요청 헤더라서, 갱신된
      // 토큰을 요청 헤더에도 반영해줘야 이번 요청에서 바로 로그인 화면으로 튕기지 않는다.
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('cookie', mergeCookieHeader(requestHeaders.get('cookie'), outcome.cookies));

      const response = NextResponse.next({ request: { headers: requestHeaders } });
      outcome.cookies.forEach((cookie) => response.headers.append('Set-Cookie', cookie));
      return response;
    }
    // 'rejected'(DB 초기화 등으로 백엔드가 이 토큰을 실제로 거부함)와 'unreachable'(네트워크 오류
    // 등으로 토큰 상태를 아예 확인 못 함)을 구분한다 — 후자까지 무효 토큰 취급해 쿠키를 지우면,
    // 백엔드가 잠깐 응답 안 했을 뿐인 멀쩡한 세션까지 로그아웃시켜버린다.
    refreshWasRejected = outcome.status === 'rejected';
  }

  // refreshToken이 있었는데 실제로 거부당했다면(DB 초기화 등으로 더 이상 유효하지 않은 경우) 그
  // 쿠키를 지우지 않으면 브라우저가 계속 들고 있다가 보호 페이지에 접근할 때마다 이 흐름을 반복해
  // 백엔드에 매번 "유효하지 않은 Refresh Token입니다" 요청을 만든다.
  const response = NextResponse.redirect(new URL('/login', request.url));
  if (refreshWasRejected) {
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
  }
  return response;
}

export const config = {
  matcher: [
    '/home/:path*',
    '/properties/:path*',
    '/checklist/:path*',
    '/checklists/:path*',
    '/contract/:path*',
    '/mypage/:path*',
  ],
};
