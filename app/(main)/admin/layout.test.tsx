import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../lib/api/http';
import AdminLayout from './layout';

let mockPathname = '/admin';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

const getCurrentUser = vi.fn();
vi.mock('../../services/auth', () => ({
  getCurrentUser: (...args: unknown[]) => getCurrentUser(...args),
}));

describe('AdminLayout', () => {
  beforeEach(() => {
    mockPathname = '/admin';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // 회귀 테스트 - 이미 ADMIN으로 인가된 뒤 탭 이동(pathname 변경)마다 이 게이트가 화면 전체를
  // 'checking' 스피너로 덮어 AdminNav/children이 매번 언마운트되는 것처럼 보였다. 최초 로드에서만
  // 전체화면 스피너가 뜨고, 인가된 뒤의 탭 이동에서는 재검증 중에도 기존 화면(AdminNav)이 계속
  // 보여야 한다.
  it('이미 인가된 뒤에는 탭 이동 시 전체화면 스피너로 되돌아가지 않는다', async () => {
    getCurrentUser.mockResolvedValue({ userId: 1, role: 'ADMIN' });

    const { rerender } = render(
      <AdminLayout>
        <div data-testid="page-content">유저 관리</div>
      </AdminLayout>,
    );

    await screen.findByTestId('page-content');
    expect(getCurrentUser).toHaveBeenCalledTimes(1);

    // 다음 탭으로 이동 - getCurrentUser는 아직 resolve되지 않은 새 pending Promise를 반환한다.
    let resolveSecondCheck: (value: { userId: number; role: string }) => void = () => {};
    getCurrentUser.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSecondCheck = resolve;
        }),
    );
    mockPathname = '/admin/users';
    rerender(
      <AdminLayout>
        <div data-testid="page-content">유저 관리</div>
      </AdminLayout>,
    );

    // 재검증 응답이 아직 안 왔어도 이전 화면(AdminNav 포함)이 계속 보여야 하고, 전체화면 스피너로
    // 바뀌면 안 된다.
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByText('유저 관리', { selector: 'a' })).toBeInTheDocument();

    resolveSecondCheck({ userId: 1, role: 'ADMIN' });
    await waitFor(() => expect(getCurrentUser).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });

  // 최초 로드에서는 여전히 전체화면 스피너를 보여줘야 한다(기존 동작 유지 확인).
  it('최초 로드 중에는 전체화면 스피너를 보여준다', async () => {
    let resolveCheck: (value: { userId: number; role: string }) => void = () => {};
    getCurrentUser.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveCheck = resolve;
        }),
    );

    render(
      <AdminLayout>
        <div data-testid="page-content">대시보드</div>
      </AdminLayout>,
    );

    expect(screen.queryByTestId('page-content')).not.toBeInTheDocument();

    resolveCheck({ userId: 1, role: 'ADMIN' });
    await screen.findByTestId('page-content');
  });

  // 인가된 뒤 권한이 중간에 박탈되면(재검증 결과가 ADMIN이 아님) 여전히 즉시 쫓아내야 한다 -
  // 백그라운드 재검증으로 바꾸면서 이 보안 속성이 깨지지 않았는지 확인한다.
  it('탭 이동 중 권한이 박탈되면 즉시 404 화면으로 전환된다', async () => {
    getCurrentUser.mockResolvedValue({ userId: 1, role: 'ADMIN' });

    const { rerender } = render(
      <AdminLayout>
        <div data-testid="page-content">유저 관리</div>
      </AdminLayout>,
    );
    await screen.findByTestId('page-content');

    getCurrentUser.mockResolvedValueOnce({ userId: 1, role: 'USER' });
    mockPathname = '/admin/reports';
    rerender(
      <AdminLayout>
        <div data-testid="page-content">유저 관리</div>
      </AdminLayout>,
    );

    await waitFor(() => expect(screen.getByText('페이지를 찾을 수 없습니다.')).toBeInTheDocument());
  });

  // 실제 권한 없음(forbidden)과 일시적 네트워크/CORS 오류(unreachable)를 구분해야 한다 - 후자까지
  // 404로 접으면 진짜 관리자도 일시 장애 때 재시도해야 한다는 사실조차 알 수 없다.
  it('일시적 오류(unreachable)면 404 대신 재시도 안내를 보여준다', async () => {
    getCurrentUser.mockRejectedValueOnce(new ApiError('network error', 0));

    render(
      <AdminLayout>
        <div data-testid="page-content">대시보드</div>
      </AdminLayout>,
    );

    expect(await screen.findByText('일시적인 오류로 페이지를 확인할 수 없습니다.')).toBeInTheDocument();
    expect(screen.queryByText('페이지를 찾을 수 없습니다.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });

  // "다시 시도" 버튼은 setState('checking')만으로는 pathname이 안 바뀌어 effect가 재실행되지
  // 않는다 - retryToken을 늘려 재조회를 강제하는지 확인한다.
  it('"다시 시도" 버튼을 누르면 인가 확인을 다시 시도하고, 성공하면 정상 화면을 보여준다', async () => {
    getCurrentUser.mockRejectedValueOnce(new ApiError('network error', 0));

    render(
      <AdminLayout>
        <div data-testid="page-content">대시보드</div>
      </AdminLayout>,
    );

    await screen.findByRole('button', { name: '다시 시도' });
    expect(getCurrentUser).toHaveBeenCalledTimes(1);

    getCurrentUser.mockResolvedValueOnce({ userId: 1, role: 'ADMIN' });
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    await waitFor(() => expect(getCurrentUser).toHaveBeenCalledTimes(2));
    await screen.findByTestId('page-content');
  });
});
