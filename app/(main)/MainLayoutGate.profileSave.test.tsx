import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MainLayoutGate from './MainLayoutGate';
import { useMainCurrentUser } from './MainCurrentUserContext';

vi.mock('next/navigation', () => ({
  usePathname: () => '/mypage',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

const getCurrentUser = vi.fn();
vi.mock('../services/auth', () => ({
  getCurrentUser: (...args: unknown[]) => getCurrentUser(...args),
  logout: vi.fn(),
}));

// ProfileClient.tsx가 프로필 저장에 성공한 직후 실제로 하는 일을 그대로 흉내내는 stub -
// getCurrentUser()를 다시 부르지 않고, 이미 저장 응답으로 받은 값만으로 헤더를 갱신한다.
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

describe('MainLayoutGate + MainLayoutClient (crossOriginAuth 경로) - 프로필 저장 후 헤더 즉시 갱신', () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // 회귀 테스트 - MainLayoutGate는 마운트당 한 번만 /auth/me를 확인한다(의도적 불변식,
  // MainLayoutGate.tsx 참고). ProfileClient가 프로필을 저장한 뒤 헤더 닉네임/프로필 사진을
  // 갱신하려면 이 게이트가 다시 인증을 확인할 필요 없이(=getCurrentUser를 다시 호출하지 않고도)
  // MainCurrentUserContext의 updateCurrentUser만으로 반영돼야 한다.
  it('프로필 저장을 시뮬레이션해도 getCurrentUser를 다시 호출하지 않고 헤더 닉네임/프로필 사진이 즉시 갱신된다', async () => {
    getCurrentUser.mockResolvedValue({ nickname: '홍길동', profileImageUrl: null, role: 'USER' });

    render(
      <MainLayoutGate>
        <ProfileSaveStub />
      </MainLayoutGate>,
    );

    expect(await screen.findByText('홍길동님')).toBeInTheDocument();
    expect(getCurrentUser).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '프로필 저장 시뮬레이션' }));

    expect(screen.queryByText('홍길동님')).not.toBeInTheDocument();
    expect(screen.getByText('새닉네임님')).toBeInTheDocument();
    // 헤더 갱신이 재조회로 이뤄진 게 아님을 확인한다 - 여전히 최초 1회뿐이어야 한다.
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
  });
});
