'use client';

import { createContext, useContext } from 'react';

// MainLayoutClient가 로그인 판단 과정에서 이미 확인해둔 본인 정보(닉네임/프로필 이미지)를
// 하위 페이지가 그대로 재사용하도록 Context로 내려준다 - 없으면 mypage/page.tsx처럼 인사말에
// nickname이 필요한 화면마다 getCurrentUser()를 또 호출해 /auth/me가 불필요하게 두 번
// 왕복하게 된다(admin/AdminCurrentUserContext.tsx와 동일한 이유).
// MainLayoutClient는 nickname/profileImageUrl을 필수 prop으로 받아야만 렌더링되므로(부모인
// layout.tsx/MainLayoutGate.tsx가 로그인 확인에 성공했을 때만 MainLayoutClient를 그린다) 이
// Provider 하위에서는 항상 값이 채워져 있다 - 소비하는 쪽은 null 체크 없이 바로 써도 된다.
export type MainCurrentUser = { nickname: string; profileImageUrl: string | null };

// updateCurrentUser: ProfileClient가 프로필 저장에 성공한 직후, 그 응답으로 받은 최신
// nickname/profileImageUrl을 헤더(MainLayoutClient)에 즉시 반영하기 위한 setter다. crossOriginAuth
// 배포에서는 MainLayoutGate가 마운트당 한 번만 /auth/me를 확인하므로(MainLayoutGate.tsx 참고)
// router.refresh()로는 헤더가 갱신되지 않는다 - 이 setter는 재조회 없이 이미 알고 있는 값을
// 그대로 반영해 두 auth 모드 모두에서 동일하게 동작한다(MainLayoutClient가 상태를 소유하고 props
// 변경 시 동기화하므로, same-origin 경로의 기존 router.refresh() 기반 갱신과도 충돌하지 않는다).
export type MainCurrentUserContextValue = MainCurrentUser & {
  updateCurrentUser: (patch: Partial<MainCurrentUser>) => void;
};

const MainCurrentUserContext = createContext<MainCurrentUserContextValue | null>(null);

export const MainCurrentUserProvider = MainCurrentUserContext.Provider;

export function useMainCurrentUser(): MainCurrentUserContextValue {
  const value = useContext(MainCurrentUserContext);
  if (!value) {
    throw new Error('useMainCurrentUser는 MainLayoutClient 하위에서만 호출할 수 있습니다.');
  }
  return value;
}
