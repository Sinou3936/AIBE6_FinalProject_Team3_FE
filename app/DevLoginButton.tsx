'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { devLogin } from './services/auth';

// 개발 편의용 버튼 — NEXT_PUBLIC_ENABLE_DEV_LOGIN=true일 때만 렌더링된다(기본값 false).
// 백엔드도 DEV_LOGIN_ENABLED가 꺼져 있으면(운영 등) 이 요청을 404로 거부하므로 이중으로 막혀 있다.
export function DevLoginButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  if (process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN !== 'true') {
    return null;
  }

  const handleClick = async () => {
    setIsLoading(true);
    setFailed(false);
    try {
      await devLogin();
      router.push('/home');
      router.refresh();
    } catch (error) {
      // 개발 전용 버튼이지만, 실패를 완전히 삼키면 404(DEV_LOGIN_ENABLED 미적용 등)와
      // 네트워크 오류를 구분하기 어려워 원인 파악이 오래 걸린다 — 콘솔에 원인을 남기고
      // 버튼 옆에도 짧게 실패 상태를 보여준다.
      console.warn('[DevLoginButton] dev-login 실패:', error);
      setFailed(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="text-[11px] text-slate-300 transition-colors hover:text-slate-400 disabled:opacity-60"
      >
        {isLoading ? '개발자 로그인 중...' : '개발자용 관리자 로그인'}
      </button>
      {failed && <span className="text-[11px] text-red-400">실패 (콘솔 확인)</span>}
    </span>
  );
}
