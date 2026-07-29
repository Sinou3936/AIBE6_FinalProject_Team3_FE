'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logout } from '../services/auth';

// MainLayoutClient.tsx(헤더)와 MyPageClient.tsx 양쪽에서 거의 동일한 로그아웃 처리 로직이
// 중복돼 있다가, 한쪽만 고치고 다른 쪽을 빠뜨리는 drift가 실제로 한 번 있었다(모바일 메뉴 버튼의
// "로그아웃 중..." 표시가 나중에야 따라붙음) — 한 곳으로 모아 그런 일을 구조적으로 막는다.
export function useLogout() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string>();

  // 서버 호출이 실패하면(네트워크 오류, 백엔드 일시 장애 등) 로그아웃은 실제로 안 됐을 수 있다 —
  // 무조건 /login으로 보내면 사용자는 로그아웃된 줄 알지만 서버 세션은 그대로 남는다. 성공했을
  // 때만 이동하고, 실패하면 호출부가 에러를 보여주며 현재 페이지에 남기도록 logoutError를 반환한다.
  // isLoggingOut으로 중복 호출도 막는다(어느 진입점에서 호출되든 동일하게 적용됨).
  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    setLogoutError(undefined);
    try {
      await logout();
      router.push('/login');
    } catch {
      setLogoutError('로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setIsLoggingOut(false);
    }
  }

  return { isLoggingOut, logoutError, handleLogout };
}
