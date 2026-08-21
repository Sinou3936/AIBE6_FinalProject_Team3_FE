import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type AdminUserListItemDto, type PageResponseDto } from '../../../types/api';
import { AdminCurrentUserProvider } from '../AdminCurrentUserContext';
import AdminUsersPage from './page';

let mockSearchParams = new URLSearchParams();
// 매 호출마다 새 객체를 반환하면(예: () => ({ push: vi.fn(), replace: vi.fn() })), 이 router
// 객체를 의존성으로 삼는 clampToValidPage/reloadUsers의 useCallback이 렌더마다 재생성되어
// useEffect가 무한 재실행되는(getAdminUsers를 계속 다시 호출하는) 루프에 빠진다 - 참조가
// 안정적이도록 모듈 스코프의 고정 객체를 반환한다.
const routerMock = { push: vi.fn(), replace: vi.fn() };
vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  useSearchParams: () => mockSearchParams,
}));

const getAdminUsers = vi.fn();
vi.mock('../../../services/admin', () => ({
  getAdminUsers: (...args: unknown[]) => getAdminUsers(...args),
}));

const updateAdminUserStatus = vi.fn();
vi.mock('../../../services/adminActions', () => ({
  updateAdminUserRole: vi.fn(),
  updateAdminUserStatus: (...args: unknown[]) => updateAdminUserStatus(...args),
  bulkUpdateAdminUserStatus: vi.fn(),
}));

function user(overrides: Partial<AdminUserListItemDto>): AdminUserListItemDto {
  return {
    id: 2,
    email: 'target@example.com',
    nickname: '대상유저',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function page(content: AdminUserListItemDto[]): PageResponseDto<AdminUserListItemDto> {
  return { content, page: 0, size: 20, totalPages: 1, totalElements: content.length, hasNext: false };
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // 회귀 테스트 - 유저 상태 변경 자체는 서버에서 이미 성공했는데, 그 직후 목록 재조회(onMutated)만
  // 일시적으로 실패하면 기존에는 목록 전체가 지워지고 에러 배너만 남아 방금 확정한 변경이 실패한
  // 것처럼 보였다. 지금은 재조회 실패 시에도 마지막으로 성공한 목록을 그대로 보여주면서 경고만
  // 추가로 떠야 한다.
  it('변경 후 목록 재조회만 실패해도 기존 목록은 그대로 남고 경고만 추가된다', async () => {
    getAdminUsers.mockResolvedValueOnce(page([user({})]));
    updateAdminUserStatus.mockResolvedValue({ id: 2, role: 'USER', status: 'SUSPENDED' });
    getAdminUsers.mockRejectedValueOnce(new Error('network blip'));

    render(
      <AdminCurrentUserProvider value={{ userId: 1 }}>
        <AdminUsersPage />
      </AdminCurrentUserProvider>,
    );

    await screen.findByText('target@example.com');

    fireEvent.click(screen.getByRole('button', { name: '정지' }));
    fireEvent.click(await screen.findByRole('button', { name: '확인' }));

    await waitFor(() => expect(updateAdminUserStatus).toHaveBeenCalled());
    await waitFor(() => expect(getAdminUsers).toHaveBeenCalledTimes(2));

    // 목록은 여전히 보여야 한다(지워지면 안 된다) - 방금 성공한 변경이 실패한 것처럼 보이면 안 된다.
    expect(screen.getByText('target@example.com')).toBeInTheDocument();
    // resolveErrorMessage는 Error 인스턴스면 그 message를 그대로 보여준다(fallback 문구는 Error가
    // 아니거나 message가 빈 경우에만 쓰인다) - 재조회가 실패했다는 경고 자체가 목록과 함께 보이는지만 확인한다.
    expect(await screen.findByText('network blip')).toBeInTheDocument();
  });

  // 회귀 테스트(2026-08-20 전수조사) - 오래된 북마크/수동 편집 링크가 이제는 존재하지 않는
  // role/status 값을 담고 있으면, 그 값을 그대로 getAdminUsers에 넘겨 백엔드 에러로 이어지거나
  // select의 value가 어떤 option과도 안 맞는 불일치가 생겼다. admin/reports/page.tsx가 status에
  // 대해 이미 하는 것과 동일하게, 알 수 없는 값은 "필터 없음"으로 되돌려야 한다.
  it('알 수 없는 role/status 파라미터는 필터 없이 조회하고 드롭다운도 전체로 보여준다', async () => {
    mockSearchParams = new URLSearchParams('role=STAFF&status=DELETED');
    getAdminUsers.mockResolvedValue(page([]));

    render(
      <AdminCurrentUserProvider value={{ userId: 1 }}>
        <AdminUsersPage />
      </AdminCurrentUserProvider>,
    );

    await screen.findByText('조건에 맞는 유저가 없습니다.');

    expect(getAdminUsers).toHaveBeenCalledWith(
      expect.objectContaining({ role: undefined, status: undefined }),
      expect.anything(),
    );
    expect((screen.getByDisplayValue('전체 권한') as HTMLSelectElement).value).toBe('');
    expect((screen.getByDisplayValue('전체 상태') as HTMLSelectElement).value).toBe('');
  });

  // 회귀 테스트(2026-08-20 전수조사) - signal 없이는 이 페이지를 벗어난 뒤에도 진행 중이던
  // fetch가 계속 진행되다 뒤늦게 도착해, clampToValidPage()가 이미 언마운트된 화면 기준으로
  // router.replace()를 실행할 수 있었다. 언마운트 시 실제로 요청이 abort되는지 확인한다.
  it('언마운트되면 진행 중인 조회 요청의 signal이 abort된다', async () => {
    let capturedSignal: AbortSignal | undefined;
    getAdminUsers.mockImplementation((_params: unknown, signal?: AbortSignal) => {
      capturedSignal = signal;
      return new Promise(() => {}); // 응답이 영원히 도착하지 않는 상황을 흉내낸다.
    });

    const { unmount } = render(
      <AdminCurrentUserProvider value={{ userId: 1 }}>
        <AdminUsersPage />
      </AdminCurrentUserProvider>,
    );

    await waitFor(() => expect(capturedSignal).toBeInstanceOf(AbortSignal));
    expect(capturedSignal!.aborted).toBe(false);

    unmount();

    expect(capturedSignal!.aborted).toBe(true);
  });
});
