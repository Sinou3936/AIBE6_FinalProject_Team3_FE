'use client';

import { createContext, useContext } from 'react';

// MainLayoutClient가 로그인 판단 과정에서 이미 확인해둔 본인 정보(닉네임/프로필 이미지)를
// 하위 페이지가 그대로 재사용하도록 Context로 내려준다 - 없으면 mypage/page.tsx처럼 인사말에
// nickname이 필요한 화면마다 getCurrentUser()를 또 호출해 /auth/me가 불필요하게 두 번
// 왕복하게 된다(admin/AdminCurrentUserContext.tsx와 동일한 이유).
// MainLayoutClient는 nickname/profileImageUrl을 필수 prop으로 받아야만 렌더링되므로(부모인
// layout.tsx/MainLayoutGate.tsx가 로그인 확인에 성공했을 때만 MainLayoutClient를 그린다) 이
// Provider 하위에서는 항상 값이 채워져 있다 - 소비하는 쪽은 null 체크 없이 바로 써도 된다.
type MainCurrentUser = { nickname: string; profileImageUrl: string | null };

const MainCurrentUserContext = createContext<MainCurrentUser | null>(null);

export const MainCurrentUserProvider = MainCurrentUserContext.Provider;

export function useMainCurrentUser(): MainCurrentUser {
  const value = useContext(MainCurrentUserContext);
  if (!value) {
    throw new Error('useMainCurrentUser는 MainLayoutClient 하위에서만 호출할 수 있습니다.');
  }
  return value;
}
