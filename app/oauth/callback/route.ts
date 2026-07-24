import { NextRequest, NextResponse } from 'next/server';
import { hasRegisteredProfile } from '../../lib/profile';
import { getCurrentUser } from '../../services/auth';
import { getMyProfile } from '../../services/user';

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get('error');
  if (error) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', error);
    return NextResponse.redirect(loginUrl);
  }

  const notice = request.nextUrl.searchParams.get('notice');
  const cookieHeader = request.headers.get('cookie') ?? undefined;

  try {
    await getCurrentUser(cookieHeader);
  } catch {
    return NextResponse.redirect(new URL('/login?error=session_expired', request.url));
  }

  try {
    const profile = await getMyProfile(cookieHeader);
    if (!hasRegisteredProfile(profile)) {
      return NextResponse.redirect(new URL('/mypage/profile', request.url));
    }
  } catch {
    // 프로필 조회에 실패해도 로그인 자체는 성공했으므로 홈으로 보낸다.
  }

  // notice=account_linked: 새 계정이 아니라 이미 있던 계정(로컬 가입 또는 다른 소셜)에 방금
  // 연동된 로그인이라는 신호 — 홈 화면이 이 값을 보고 안내 배너를 한 번 띄운다. 백엔드가 보낸
  // 값이라도 이 콜백 자체는 외부에서 접근 가능한 진입점이므로, 허용된 값인지 검증한 뒤에만
  // 그대로 전달한다.
  const homeUrl = new URL('/home', request.url);
  if (notice === 'account_linked') {
    homeUrl.searchParams.set('notice', notice);
  }
  return NextResponse.redirect(homeUrl);
}
