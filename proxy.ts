import { NextRequest, NextResponse } from 'next/server';

// access_token 쿠키는 httpOnly라 여기서 값을 읽어 검증할 순 없지만, 존재 여부는 확인할 수 있다.
// 실제 유효성 검증(서명/만료)은 백엔드가 각 API 호출마다 수행하므로, 여기서는
// "로그인 안 한 사용자를 로그인 화면으로 안내"하는 UX 목적의 가벼운 체크로 충분하다.
export function proxy(request: NextRequest) {
  if (!request.cookies.has('access_token')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/home/:path*', '/properties/:path*', '/checklist/:path*', '/contract/:path*', '/mypage/:path*'],
};
