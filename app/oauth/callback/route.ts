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

  return NextResponse.redirect(new URL('/home', request.url));
}
