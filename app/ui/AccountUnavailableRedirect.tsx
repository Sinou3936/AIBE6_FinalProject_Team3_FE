'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '../services/auth';

// getMyProfile()이 404(존재하지 않음/탈퇴)를 반환했을 때 렌더링한다. Server Component는 쿠키를
// 지울 수 없어(Route Handler/미들웨어만 가능), 대신 이 컴포넌트가 마운트되자마자 브라우저에서
// 직접 logout()을 호출해 세션을 정리하고 랜딩 페이지로 보낸다. 이미 깨진 화면이라 로그아웃
// 자체가 실패해도(네트워크 오류 등) 결과와 무관하게 항상 이동한다 — useLogout()과 달리 실패 시
// 현재 페이지에 남기지 않는다.
export function AccountUnavailableRedirect() {
  const router = useRouter();

  useEffect(() => {
    logout().finally(() => router.push('/'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
