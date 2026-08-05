import { NextRequest, NextResponse } from 'next/server';
import { sanitizeNextPath } from '../../lib/nextPath';
import { hasRegisteredProfile } from '../../lib/profile';
import { getCurrentUser } from '../../services/auth';
import { getMyProfile } from '../../services/user';

const OAUTH_NEXT_COOKIE = 'oauth_next';

export async function GET(request: NextRequest) {
  // 로그인 화면(SocialLoginLinks)이 구글/카카오로 넘어가기 직전에 남겨둔 원래 경로 — OAuth는
  // 제공자로 리다이렉트됐다 돌아오는 왕복이라 쿼리스트링으로 next를 들고 다닐 방법이 없어서 대신
  // 쿠키를 쓴다. 실패/성공 어느 분기로 끝나든 한 번 쓰고 나면 지워서 다음 로그인 시도에 잘못
  // 재사용되지 않게 한다.
  const rawNext = request.cookies.get(OAUTH_NEXT_COOKIE)?.value ?? null;
  const next = sanitizeNextPath(rawNext);

  const error = request.nextUrl.searchParams.get('error');
  if (error) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', error);
    // 실패해도 next는 살려서 로그인 화면(이메일 로그인/다른 소셜 로그인)이 여전히 원래 경로로
    // 복귀할 수 있게 한다 — rawNext가 있을 때만 붙여서, 애초에 next 없이 시작한 로그인 실패에는
    // 쓸데없이 /home을 next로 얹지 않는다.
    if (rawNext) {
      loginUrl.searchParams.set('next', next);
    }
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(OAUTH_NEXT_COOKIE);
    return response;
  }

  const notice = request.nextUrl.searchParams.get('notice');
  const cookieHeader = request.headers.get('cookie') ?? undefined;

  try {
    await getCurrentUser(cookieHeader);
  } catch {
    const response = NextResponse.redirect(new URL('/login?error=session_expired', request.url));
    response.cookies.delete(OAUTH_NEXT_COOKIE);
    return response;
  }

  try {
    const profile = await getMyProfile(cookieHeader);
    if (!hasRegisteredProfile(profile)) {
      const response = NextResponse.redirect(new URL('/mypage/profile', request.url));
      response.cookies.delete(OAUTH_NEXT_COOKIE);
      return response;
    }
  } catch {
    // 프로필 조회에 실패해도 로그인 자체는 성공했으므로 destination(next 또는 홈)으로 보낸다.
  }

  // notice=account_linked: 새 계정이 아니라 이미 있던 계정(로컬 가입 또는 다른 소셜)에 방금
  // 연동된 로그인이라는 신호 — 홈 화면이 이 값을 보고 안내 배너를 한 번 띄운다. 백엔드가 보낸
  // 값이라도 이 콜백 자체는 외부에서 접근 가능한 진입점이므로, 허용된 값인지 검증한 뒤에만
  // 그대로 전달한다.
  const destinationUrl = new URL(next, request.url);
  if (notice === 'account_linked') {
    destinationUrl.searchParams.set('notice', notice);
  }
  const response = NextResponse.redirect(destinationUrl);
  response.cookies.delete(OAUTH_NEXT_COOKIE);
  return response;
}
