'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { devLogin } from './services/auth';

type DevLoginButtonProps = {
  // 부모(page.tsx)가 devkey 캡처 + localStorage 조회를 한 effect 안에서 순서대로 처리한 뒤 내려주는
  // 값 - 이 컴포넌트가 스스로 localStorage를 다시 읽으면, "저장 먼저, 조회 나중"이 이 컴포넌트와
  // 부모 페이지의 effect 실행 순서(React는 자식 effect를 부모보다 먼저 실행한다)에 의존하게 돼서,
  // 방금 `/#devkey=` 링크로 들어온 첫 방문에서도 버튼이 숨어버리는 경쟁 상태가 생길 수 있다.
  devLoginKey: string | null;
};

// 개발 편의용 버튼 — NEXT_PUBLIC_ENABLE_DEV_LOGIN=true이고, 이 브라우저가 `/#devkey=<secret>`
// 부트스트랩 링크를 한 번이라도 방문해 열쇠를 저장해둔 경우에만 렌더링된다. 열쇠가 없으면(일반
// 방문자) 버튼 자체가 보이지 않아, "관리자 로그인 버튼이 있다"는 사실조차 드러나지 않는다.
// 백엔드도 DEV_LOGIN_ENABLED가 꺼져 있거나 key가 DEV_LOGIN_SECRET과 다르면 이 요청을 404로
// 거부하므로 이중으로 막혀 있다.
export function DevLoginButton({ devLoginKey }: DevLoginButtonProps) {
  const router = useRouter();
  // 관리자/일반회원 버튼이 각자 독립적으로 로딩/실패 상태를 가져야 한다 - 하나가 로그인 중일 때
  // 다른 하나까지 같이 비활성화되거나, 한쪽 실패 메시지가 다른 쪽 클릭 후에도 남아있으면 안 된다.
  const [loadingRole, setLoadingRole] = useState<'ADMIN' | 'USER' | null>(null);
  const [failedRole, setFailedRole] = useState<'ADMIN' | 'USER' | null>(null);
  // state(loadingRole)만으로 중복 클릭을 막으면, setState는 다음 렌더까지 반영이 안 되므로 그
  // 사이(같은 이벤트 루프 틱)에 두 버튼을 빠르게 연달아 누르면 button의 disabled 속성이 아직
  // 갱신되기 전이라 role이 다른 요청 두 개가 동시에 나갈 수 있다(2026-08-20 외부 리뷰에서 지적) -
  // 마지막에 도착하는 응답의 Set-Cookie가 먼저 온 응답의 쿠키를 덮어써 어느 role로 로그인됐는지
  // 예측할 수 없어진다. ref는 대입 즉시 반영되므로 handleClick 진입 시점에 동기적으로 막는다.
  const isRequestInFlightRef = useRef(false);

  if (process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN !== 'true' || !devLoginKey) {
    return null;
  }

  const handleClick = (role: 'ADMIN' | 'USER') => async () => {
    if (isRequestInFlightRef.current) {
      return;
    }
    isRequestInFlightRef.current = true;
    setLoadingRole(role);
    setFailedRole(null);
    try {
      await devLogin(devLoginKey, role);
      router.push('/home');
      router.refresh();
    } catch (error) {
      // 개발 전용 버튼이지만, 실패를 완전히 삼키면 404(DEV_LOGIN_ENABLED 미적용 등)와
      // 네트워크 오류를 구분하기 어려워 원인 파악이 오래 걸린다 — 콘솔에 원인을 남기고
      // 버튼 옆에도 짧게 실패 상태를 보여준다.
      console.warn('[DevLoginButton] dev-login 실패:', error);
      setFailedRole(role);
    } finally {
      isRequestInFlightRef.current = false;
      setLoadingRole(null);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick('ADMIN')}
        disabled={loadingRole !== null}
        className="text-[11px] text-slate-300 transition-colors hover:text-slate-400 disabled:opacity-60"
      >
        {loadingRole === 'ADMIN' ? '개발자 로그인 중...' : '개발자용 관리자 로그인'}
      </button>
      {failedRole === 'ADMIN' && <span className="text-[11px] text-red-400">실패 (콘솔 확인)</span>}
      <button
        type="button"
        onClick={handleClick('USER')}
        disabled={loadingRole !== null}
        className="text-[11px] text-slate-300 transition-colors hover:text-slate-400 disabled:opacity-60"
      >
        {loadingRole === 'USER' ? '개발자 로그인 중...' : '개발자용 일반회원 로그인'}
      </button>
      {failedRole === 'USER' && <span className="text-[11px] text-red-400">실패 (콘솔 확인)</span>}
    </span>
  );
}
