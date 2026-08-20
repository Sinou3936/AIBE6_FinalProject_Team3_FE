'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { resetAuthRefreshState } from './api/http';
import { logout } from '../services/auth';

// MainLayoutClient.tsx(헤더)와 MyPageClient.tsx 양쪽에서 거의 동일한 로그아웃 처리 로직이
// 중복돼 있다가, 한쪽만 고치고 다른 쪽을 빠뜨리는 drift가 실제로 한 번 있었다(모바일 메뉴 버튼의
// "로그아웃 중..." 표시가 나중에야 따라붙음) — 한 곳으로 모아 그런 일을 구조적으로 막는다.
//
// 이 훅은 각 컴포넌트마다 독립된 isLoggingOut state를 갖는다 — /mypage 페이지에는
// MainLayoutClient(헤더)와 MyPageClient(본문)가 동시에 마운트되어 이 훅을 각자 호출하므로, 헤더
// 버튼과 본문 버튼의 "로그아웃 중..." 표시는 서로 동기화되지 않는다(둘 다 Context 없이 지역
// state이기 때문). 다만 실제로 문제가 되는 건 화면 표시 불일치가 아니라 /auth/logout이 두 번
// 나가는 것이므로, 그 부분만 아래 logoutOnce()로 모듈 레벨에서 막는다 — 여러 인스턴스가 거의
// 동시에 호출해도 실제 네트워크 요청은 한 번만 나간다.
let logoutInFlight: Promise<void> | null = null;

function logoutOnce(): Promise<void> {
  if (!logoutInFlight) {
    logoutInFlight = logout().finally(() => {
      logoutInFlight = null;
    });
  }
  return logoutInFlight;
}

export function useLogout() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string>();

  // 서버 호출이 실패하면(네트워크 오류, 백엔드 일시 장애 등) 로그아웃은 실제로 안 됐을 수 있다 —
  // 무조건 /login으로 보내면 사용자는 로그아웃된 줄 알지만 서버 세션은 그대로 남는다. 성공했을
  // 때만 이동하고, 실패하면 호출부가 에러를 보여주며 현재 페이지에 남기도록 logoutError를 반환한다.
  // isLoggingOut으로 이 인스턴스에서의 중복 호출을 막고, logoutOnce()가 다른 인스턴스와의 중복
  // 호출까지 막는다.
  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    setLogoutError(undefined);
    // 회귀 방지 - requestJson()의 refreshInFlight/lastRefreshSucceededAt은 탭(모듈) 단위라
    // 로그아웃 후에도 이전 세션의 refresh가 남아있을 수 있다. 공유/키오스크 기기에서 같은 탭에
    // 바로 다른 계정으로 로그인하면, 그 남은 refresh의 늦은 응답이 새 로그인의 쿠키를 덮어쓰거나
    // 새 요청이 남의 refresh 결과를 기다리게 될 수 있다. logoutOnce()가 끝난 뒤에만 리셋하면
    // 늦지 않냐는 지적이 있었다 - 정확히 그렇다. 쿠키를 실제로 덮어쓰는 주체는 JS 상태가 아니라
    // 브라우저의 네트워크 응답 처리라서, /auth/logout을 보내기 "전에" 먼저 진행 중이던 refresh를
    // abort시켜야 그 응답 자체가 도착하지 않는다. 성공 후에도 한 번 더 불러, logout 호출 도중에
    // 새로 시작된 refresh(예: 다른 컴포넌트의 401)까지 마저 정리한다.
    //
    // 감수하는 좁은 부작용(전수조사 지적) - refreshOnceInBrowser()의 Promise는 탭 안 모든
    // 호출자가 공유하므로, 이 abort는 "나"뿐 아니라 같은 순간 같은 refresh를 기다리던 다른
    // 컴포넌트의 요청도 함께 취소시킨다. 그 뒤 /auth/logout 자체가 네트워크 장애로 실패하면
    // (세션은 실제로 안 끊겼는데) 그 다른 요청은 'unreachable'로 실패한다. 이건 근본적으로
    // 분리할 수 없다 - 회전형 refresh token 특성상 여러 호출자가 각자 refresh를 부르면 서로의
    // 토큰을 무효화시키므로(위 dedup 주석 참고) fetch 자체를 공유해야 하고, 공유하는 한 abort는
    // 항상 전체에 영향을 준다. 다행히 requestJson()은 'unreachable'을 절대 강제 로그아웃으로
    // 처리하지 않으므로(그 요청 하나만 부드러운 에러를 받을 뿐), 이 좁은 레이스가 사용자를
    // 잘못 로그아웃시키는 데까지는 이어지지 않는다 - 그 이상 줄이려면 refresh 자체를 호출자별로
    // 분리해야 하는데, 그건 이 dedup이 막던 원래 버그(동시 401이 refresh token을 이중 회전시켜
    // 서로를 무효화하는 문제)를 되살리는 것과 같다.
    resetAuthRefreshState();
    try {
      await logoutOnce();
      resetAuthRefreshState();
      router.push('/login');
    } catch {
      setLogoutError('로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setIsLoggingOut(false);
    }
  }

  return { isLoggingOut, logoutError, handleLogout };
}
