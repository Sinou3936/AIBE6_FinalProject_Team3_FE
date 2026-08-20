import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DevLoginButton } from './DevLoginButton';

const push = vi.fn();
const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

const devLogin = vi.fn();
vi.mock('./services/auth', () => ({
  devLogin: (...args: unknown[]) => devLogin(...args),
}));

describe('DevLoginButton', () => {
  const originalEnv = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN = 'true';
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN = originalEnv;
  });

  it('플래그가 꺼져 있거나 devLoginKey가 없으면 아무것도 렌더링하지 않는다', () => {
    const { container: withoutFlag } = render(<DevLoginButton devLoginKey="secret" />);
    process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN = 'false';
    const { container: flagOff } = render(<DevLoginButton devLoginKey="secret" />);
    process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN = 'true';
    const { container: noKey } = render(<DevLoginButton devLoginKey={null} />);

    expect(withoutFlag.textContent).toContain('개발자용 관리자 로그인'); // 정상 케이스(대조군)
    expect(flagOff.textContent).toBe('');
    expect(noKey.textContent).toBe('');
  });

  // 신규 기능(2026-08-20, 멘토링 피드백) - 관리자 계정만 있고 일반 회원 화면을 로그인 없이
  // 확인할 방법이 없었다. 일반회원 로그인 버튼을 누르면 role='USER'로 devLogin이 호출돼야 한다.
  it('"개발자용 일반회원 로그인" 버튼을 누르면 role=USER로 로그인하고 홈으로 이동한다', async () => {
    devLogin.mockResolvedValue({ id: 2, email: 'tester@algogyeyak.local', role: 'USER' });
    render(<DevLoginButton devLoginKey="secret-key" />);

    fireEvent.click(screen.getByRole('button', { name: '개발자용 일반회원 로그인' }));

    await waitFor(() => expect(devLogin).toHaveBeenCalledWith('secret-key', 'USER'));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/home'));
    expect(refresh).toHaveBeenCalled();
  });

  it('"개발자용 관리자 로그인" 버튼은 role=ADMIN으로 호출한다', async () => {
    devLogin.mockResolvedValue({ id: 1, email: 'admin@algogyeyak.local', role: 'ADMIN' });
    render(<DevLoginButton devLoginKey="secret-key" />);

    fireEvent.click(screen.getByRole('button', { name: '개발자용 관리자 로그인' }));

    await waitFor(() => expect(devLogin).toHaveBeenCalledWith('secret-key', 'ADMIN'));
  });

  // 회귀 테스트(2026-08-20, 외부 리뷰 지적) - button의 disabled는 state 갱신 후 다음 렌더에서만
  // 반영되므로, 같은 이벤트 루프 틱 안에서 두 버튼을 연달아 클릭하면 role이 다른 요청 두 개가
  // 동시에 나갈 수 있었다(마지막 응답의 쿠키가 먼저 온 응답을 덮어써 어느 role로 로그인됐는지
  // 예측 불가). ref 기반 가드가 두 번째 클릭을 실제로 막는지 확인한다.
  //
  // fireEvent는 각 호출을 스스로 act()로 감싸므로, 두 fireEvent.click()을 그냥 연달아 호출하면
  // 첫 클릭의 state 갱신(loadingRole)이 두 번째 클릭 전에 이미 커밋돼버려 disabled 속성만으로도
  // 두 번째 클릭이 막힌다 - 이러면 ref 가드를 지워도 테스트가 그대로 통과해 실제로는 아무것도
  // 검증하지 못한다(2026-08-20 전수조사에서 지적, 실제로 ref 가드를 임시로 지우고 확인함). 두
  // 클릭을 하나의 act()로 묶어야, 첫 클릭의 렌더가 커밋되기 전에 두 번째 클릭이 같은 틱에서
  // 실행되는 실제 경쟁 상태를 재현한다.
  it('같은 틱 안에서 두 버튼을 연달아 눌러도 요청은 하나만 나간다', () => {
    let resolveDevLogin: (value: { id: number; email: string; role: string }) => void;
    devLogin.mockReturnValue(
      new Promise((resolve) => {
        resolveDevLogin = resolve;
      }),
    );
    render(<DevLoginButton devLoginKey="secret-key" />);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: '개발자용 관리자 로그인' }));
      fireEvent.click(screen.getByRole('button', { name: '개발자용 일반회원 로그인' }));
    });

    expect(devLogin).toHaveBeenCalledTimes(1);
    expect(devLogin).toHaveBeenCalledWith('secret-key', 'ADMIN');
    resolveDevLogin!({ id: 1, email: 'admin@algogyeyak.local', role: 'ADMIN' });
  });

  // 회귀 테스트 - 두 버튼은 서로 독립된 로딩/실패 상태를 가져야 한다. 한쪽이 실패해도 다른 쪽
  // 버튼까지 실패 표시가 뜨거나, 한쪽이 로딩 중일 때 다른 쪽 클릭 자체가 막히는 건 의도된 동작
  // (동시 두 요청 방지)이지만 실패 메시지는 클릭한 버튼에만 붙어야 한다.
  it('한쪽 로그인이 실패해도 실패 표시는 그 버튼에만 붙는다', async () => {
    devLogin.mockRejectedValueOnce(new Error('network error'));
    render(<DevLoginButton devLoginKey="secret-key" />);

    fireEvent.click(screen.getByRole('button', { name: '개발자용 일반회원 로그인' }));

    await screen.findAllByText('실패 (콘솔 확인)');
    const failureMessages = screen.getAllByText('실패 (콘솔 확인)');
    expect(failureMessages).toHaveLength(1);
    expect(push).not.toHaveBeenCalled();
  });

  // 회귀 테스트(2026-08-20 전수조사) - 위 테스트는 실패 표시가 "1개만" 있는지만 확인해서, 그
  // 1개가 엉뚱하게 클릭하지 않은 버튼(관리자) 옆에 붙어도 통과했다. 실제로 클릭한 버튼(일반회원)
  // 옆에 붙는지까지 DOM 위치로 확인한다.
  it('실패 표시는 관리자 버튼이 아니라 실제로 클릭한 버튼 옆에 붙는다', async () => {
    devLogin.mockRejectedValueOnce(new Error('network error'));
    render(<DevLoginButton devLoginKey="secret-key" />);

    fireEvent.click(screen.getByRole('button', { name: '개발자용 일반회원 로그인' }));

    const failureMessage = await screen.findByText('실패 (콘솔 확인)');
    const userButton = screen.getByRole('button', { name: '개발자용 일반회원 로그인' });
    const adminButton = screen.getByRole('button', { name: '개발자용 관리자 로그인' });
    expect(failureMessage.previousElementSibling).toBe(userButton);
    expect(failureMessage.previousElementSibling).not.toBe(adminButton);
  });
});
