'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { devLogin } from './services/auth';

// 개발 편의용 버튼 — NEXT_PUBLIC_ENABLE_DEV_LOGIN=true일 때만 렌더링된다(기본값 false).
// 백엔드도 DEV_LOGIN_ENABLED가 꺼져 있으면(운영 등) 이 요청을 404로 거부하므로 이중으로 막혀 있다.
export function DevLoginButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN !== 'true') {
    return null;
  }

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await devLogin();
      router.push('/home');
      router.refresh();
    } catch {
      // 개발 전용 버튼이라 실패 이유는 콘솔/네트워크 탭에서 확인하면 충분하다.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="text-[11px] text-slate-300 transition-colors hover:text-slate-400 disabled:opacity-60"
    >
      {isLoading ? '개발자 로그인 중...' : '개발자용 관리자 로그인'}
    </button>
  );
}
