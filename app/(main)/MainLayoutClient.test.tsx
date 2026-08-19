import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MainLayoutClient from './MainLayoutClient';
import { useMainCurrentUser } from './MainCurrentUserContext';

vi.mock('next/navigation', () => ({
  usePathname: () => '/home',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../services/auth', () => ({
  logout: vi.fn(),
}));

// ProfileClient.tsx가 프로필 저장 성공 직후 실제로 하는 일(useMainCurrentUser().updateCurrentUser 호출)을
// 흉내내는 최소 stub이다.
function ProfileSaveStub() {
  const { updateCurrentUser } = useMainCurrentUser();
  return (
    <button
      onClick={() => updateCurrentUser({ nickname: '새닉네임', profileImageUrl: 'https://example.com/new.png' })}
    >
      프로필 저장 시뮬레이션
    </button>
  );
}

describe('MainLayoutClient', () => {
  // 회귀 테스트 - crossOriginAuth 배포에서는 MainLayoutGate가 마운트당 한 번만 /auth/me를
  // 확인하므로(MainLayoutGate.tsx 참고), ProfileClient가 프로필을 저장해도 재조회 없이는 헤더
  // 닉네임/프로필 사진을 갱신할 방법이 없었다(전체 새로고침 전까지 낡은 값이 계속 보임). 이제
  // MainCurrentUserContext의 updateCurrentUser를 호출하면, nickname/profileImageUrl prop이
  // 전혀 바뀌지 않아도(=getCurrentUser를 다시 호출한 적 없어도) 헤더가 즉시 갱신돼야 한다.
  it('updateCurrentUser를 호출하면 props(nickname/profileImageUrl) 변경 없이도 헤더가 즉시 갱신된다', () => {
    render(
      <MainLayoutClient nickname="홍길동" profileImageUrl={null} isAdmin={false}>
        <ProfileSaveStub />
      </MainLayoutClient>,
    );

    expect(screen.getByText('홍길동님')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '프로필 저장 시뮬레이션' }));

    expect(screen.queryByText('홍길동님')).not.toBeInTheDocument();
    expect(screen.getByText('새닉네임님')).toBeInTheDocument();
  });

  // same-origin 경로((main)/layout.tsx, Server Component)는 router.refresh()로 nickname/
  // profileImageUrl prop 자체를 다시 가져와 내려준다 - updateCurrentUser라는 새 메커니즘을
  // 추가하면서 이 기존 prop 기반 갱신 경로를 깨지 않았는지 확인한다.
  it('nickname/profileImageUrl prop이 바뀌면(예: router.refresh() 이후 재렌더) 헤더도 그대로 따라간다', () => {
    const { rerender } = render(
      <MainLayoutClient nickname="홍길동" profileImageUrl={null} isAdmin={false}>
        <div />
      </MainLayoutClient>,
    );

    expect(screen.getByText('홍길동님')).toBeInTheDocument();

    rerender(
      <MainLayoutClient nickname="김철수" profileImageUrl={null} isAdmin={false}>
        <div />
      </MainLayoutClient>,
    );

    expect(screen.queryByText('홍길동님')).not.toBeInTheDocument();
    expect(screen.getByText('김철수님')).toBeInTheDocument();
  });
});
