import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { type AdminUserListItemDto, type PageResponseDto } from '../../../types/api';
import { AdminUsersClient } from './AdminUsersClient';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

const updateAdminUserRole = vi.fn();
const updateAdminUserStatus = vi.fn();
const bulkUpdateAdminUserStatus = vi.fn();
vi.mock('../../../services/adminActions', () => ({
  updateAdminUserRole: (...args: unknown[]) => updateAdminUserRole(...args),
  updateAdminUserStatus: (...args: unknown[]) => updateAdminUserStatus(...args),
  bulkUpdateAdminUserStatus: (...args: unknown[]) => bulkUpdateAdminUserStatus(...args),
}));

function user(overrides: Partial<AdminUserListItemDto>): AdminUserListItemDto {
  return {
    id: 1,
    email: 'user@example.com',
    nickname: '유저',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function page(
  content: AdminUserListItemDto[],
  overrides: Partial<PageResponseDto<AdminUserListItemDto>> = {},
): PageResponseDto<AdminUserListItemDto> {
  return { content, page: 0, size: 20, totalPages: 1, totalElements: content.length, hasNext: false, ...overrides };
}

const filters = { email: '', nickname: '', role: '', status: '' };

describe('AdminUsersClient', () => {
  it('로그인한 관리자 본인의 행에는 관리자 해제/정지 버튼 대신 안내 문구를 보여준다', () => {
    render(
      <AdminUsersClient
        data={page([user({ id: 1, nickname: '관리자', role: 'ADMIN' })])}
        filters={filters}
        currentUserId={1}
      />,
    );

    expect(screen.getByText('본인 계정')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '관리자 해제' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '정지' })).not.toBeInTheDocument();
  });

  it('다른 유저의 행에는 관리자 해제/정지 버튼을 정상적으로 보여준다', () => {
    render(
      <AdminUsersClient
        data={page([user({ id: 2, nickname: '다른유저', role: 'USER' })])}
        filters={filters}
        currentUserId={1}
      />,
    );

    expect(screen.queryByText('본인 계정')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '관리자 지정' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '정지' })).toBeInTheDocument();
  });

  it('탈퇴한 유저의 행에는 어떤 액션도 보여주지 않는다', () => {
    render(
      <AdminUsersClient
        data={page([user({ id: 2, nickname: '탈퇴유저', status: 'WITHDRAWN' })])}
        filters={filters}
        currentUserId={1}
      />,
    );

    expect(screen.queryByText('본인 계정')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '관리자 지정' })).not.toBeInTheDocument();
  });

  // 회귀 테스트 - 한 유저에 대한 액션이 실패해 모달에 에러가 남은 채로 닫고, 다른 유저의
  // 액션 모달을 열면 이전 에러가 그대로 보이던 문제. 새 액션을 열 때 actionError를 리셋해야 한다.
  it('한 유저의 액션 실패 메시지가 다른 유저의 액션 모달에 남지 않는다', async () => {
    updateAdminUserRole.mockRejectedValueOnce(new Error('권한 변경에 실패했습니다.'));

    render(
      <AdminUsersClient
        data={page([
          user({ id: 2, nickname: '유저둘', role: 'USER' }),
          user({ id: 3, nickname: '유저셋', role: 'USER' }),
        ])}
        filters={filters}
        currentUserId={1}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: '관리자 지정' })[0]);
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(screen.getByText('권한 변경에 실패했습니다.')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    fireEvent.click(screen.getAllByRole('button', { name: '관리자 지정' })[1]);

    expect(screen.queryByText('권한 변경에 실패했습니다.')).not.toBeInTheDocument();
  });

  // (2026-08-12 추가) "정지" 액션 자체(성공/실패)를 검증하는 테스트가 지금까지 하나도 없었다 -
  // updateAdminUserStatus가 실제로 (userId, {status:'SUSPENDED'})로 호출되는지, 성공 시 모달이
  // 닫히고 onMutated가 불리는지를 확인한다.
  it('정지 버튼 클릭 후 확인하면 updateAdminUserStatus를 호출하고 모달을 닫은 뒤 목록을 새로고침한다', async () => {
    updateAdminUserStatus.mockResolvedValueOnce(undefined);
    const onMutated = vi.fn();

    render(
      <AdminUsersClient
        data={page([user({ id: 2, nickname: '유저둘', status: 'ACTIVE' })])}
        filters={filters}
        currentUserId={1}
        onMutated={onMutated}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '정지' }));
    expect(screen.getByText('이 유저를 정지할까요?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(updateAdminUserStatus).toHaveBeenCalledWith(2, { status: 'SUSPENDED' }));
    await waitFor(() => expect(screen.queryByText('이 유저를 정지할까요?')).not.toBeInTheDocument());
    expect(onMutated).toHaveBeenCalledTimes(1);
  });

  // 실패 경로 - 컴포넌트 코드(confirmAction의 catch)는 실패 시 모달을 닫지 않고 actionError만
  // 채워 사용자가 같은 모달에서 재시도하거나 취소할 수 있게 한다. 이 동작도 지금까지 정지
  // 액션에서는 한 번도 검증된 적이 없었다.
  it('정지 실패 시 모달을 닫지 않고 에러 메시지를 보여준다', async () => {
    updateAdminUserStatus.mockRejectedValueOnce(new Error('정지 처리에 실패했습니다.'));

    render(
      <AdminUsersClient
        data={page([user({ id: 2, nickname: '유저둘', status: 'ACTIVE' })])}
        filters={filters}
        currentUserId={1}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '정지' }));
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(screen.getByText('정지 처리에 실패했습니다.')).toBeInTheDocument());
    expect(screen.getByText('이 유저를 정지할까요?')).toBeInTheDocument();
  });

  // 역할 토글 성공 경로 - updateAdminUserRole이 실제로 어떤 인자로 호출되는지 지금까지 검증한
  // 적이 없었다(기존 역할 액션 테스트는 실패(rejection)만 검증하고 호출 인자는 확인하지 않았다).
  // USER -> ADMIN 방향("관리자 지정")을 확인한다.
  it('관리자 지정 버튼 클릭 후 확인하면 updateAdminUserRole을 ADMIN으로 호출하고 모달을 닫은 뒤 목록을 새로고침한다', async () => {
    updateAdminUserRole.mockResolvedValueOnce(undefined);
    const onMutated = vi.fn();

    render(
      <AdminUsersClient
        data={page([user({ id: 2, nickname: '유저둘', role: 'USER' })])}
        filters={filters}
        currentUserId={1}
        onMutated={onMutated}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '관리자 지정' }));
    expect(screen.getByText('관리자로 지정할까요?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(updateAdminUserRole).toHaveBeenCalledWith(2, { role: 'ADMIN' }));
    await waitFor(() => expect(screen.queryByText('관리자로 지정할까요?')).not.toBeInTheDocument());
    expect(onMutated).toHaveBeenCalledTimes(1);
  });

  // 반대 방향(ADMIN -> USER, "관리자 해제")도 함께 확인한다.
  it('관리자 해제 버튼 클릭 후 확인하면 updateAdminUserRole을 USER로 호출한다', async () => {
    updateAdminUserRole.mockResolvedValueOnce(undefined);

    render(
      <AdminUsersClient
        data={page([user({ id: 2, nickname: '유저둘', role: 'ADMIN' })])}
        filters={filters}
        currentUserId={1}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '관리자 해제' }));
    expect(screen.getByText('관리자 권한을 해제할까요?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(updateAdminUserRole).toHaveBeenCalledWith(2, { role: 'USER' }));
  });

  // 탈퇴 유저/본인 계정은 단건 액션 버튼도 이미 숨긴다(위 테스트 참고) - 일괄처리 체크박스도
  // 같은 이유로 같은 대상을 선택 불가로 막아야 한다.
  it('본인 계정과 탈퇴한 유저의 체크박스는 비활성화된다', () => {
    render(
      <AdminUsersClient
        data={page([
          user({ id: 1, nickname: '관리자', role: 'ADMIN' }),
          user({ id: 2, nickname: '탈퇴유저', status: 'WITHDRAWN' }),
          user({ id: 3, nickname: '일반유저' }),
        ])}
        filters={filters}
        currentUserId={1}
      />,
    );

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    // 0번은 헤더(전체선택), 1~3번이 각 행(관리자 본인/탈퇴유저/일반유저) 순서.
    expect(checkboxes[1]).toBeDisabled();
    expect(checkboxes[2]).toBeDisabled();
    expect(checkboxes[3]).not.toBeDisabled();
  });

  it('체크박스로 선택하면 일괄처리 액션바가 나타나고, 일괄 정지를 확인하면 선택된 id로 bulkUpdateAdminUserStatus를 호출한다', async () => {
    bulkUpdateAdminUserStatus.mockResolvedValueOnce({ succeededIds: [2, 3], failures: [] });
    const onMutated = vi.fn();

    render(
      <AdminUsersClient
        data={page([user({ id: 2, nickname: '유저둘' }), user({ id: 3, nickname: '유저셋' })])}
        filters={filters}
        currentUserId={1}
        onMutated={onMutated}
      />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);

    expect(screen.getByText('2명 선택됨')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '선택 정지' }));
    expect(screen.getByText('선택한 2명을 정지할까요?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(bulkUpdateAdminUserStatus).toHaveBeenCalledWith({ userIds: [2, 3], status: 'SUSPENDED' }),
    );
    expect(await screen.findByText('일괄 처리 결과')).toBeInTheDocument();
    expect(screen.getByText('성공 2명')).toBeInTheDocument();
    expect(onMutated).toHaveBeenCalledTimes(1);
  });

  // 일괄 정지 해제(ACTIVE) 경로는 지금까지 검증된 적이 없었다(일괄 정지(SUSPENDED)만 테스트됨).
  it('체크박스로 선택하면 일괄처리 액션바가 나타나고, 일괄 정지 해제를 확인하면 선택된 id로 bulkUpdateAdminUserStatus를 ACTIVE로 호출한다', async () => {
    bulkUpdateAdminUserStatus.mockResolvedValueOnce({ succeededIds: [2, 3], failures: [] });
    const onMutated = vi.fn();

    render(
      <AdminUsersClient
        data={page([
          user({ id: 2, nickname: '유저둘', status: 'SUSPENDED' }),
          user({ id: 3, nickname: '유저셋', status: 'SUSPENDED' }),
        ])}
        filters={filters}
        currentUserId={1}
        onMutated={onMutated}
      />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);

    expect(screen.getByText('2명 선택됨')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '선택 정지 해제' }));
    expect(screen.getByText('선택한 2명을 정지 해제할까요?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(bulkUpdateAdminUserStatus).toHaveBeenCalledWith({ userIds: [2, 3], status: 'ACTIVE' }),
    );
    expect(await screen.findByText('일괄 처리 결과')).toBeInTheDocument();
    expect(screen.getByText('성공 2명')).toBeInTheDocument();
    expect(onMutated).toHaveBeenCalledTimes(1);
  });

  it('일괄처리가 부분 실패하면 결과 모달에 실패 항목을 보여준다', async () => {
    bulkUpdateAdminUserStatus.mockResolvedValueOnce({
      succeededIds: [2],
      failures: [{ id: 3, message: '마지막 남은 관리자 계정은 강등하거나 정지할 수 없습니다.' }],
    });

    render(
      <AdminUsersClient
        data={page([user({ id: 2, nickname: '유저둘' }), user({ id: 3, nickname: '유저셋', role: 'ADMIN' })])}
        filters={filters}
        currentUserId={1}
      />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // 전체 선택

    fireEvent.click(screen.getByRole('button', { name: '선택 정지' }));
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(await screen.findByText('성공 1명, 실패 1명')).toBeInTheDocument();
    expect(screen.getByText(/마지막 남은 관리자 계정은 강등하거나 정지할 수 없습니다/)).toBeInTheDocument();
  });

  // 회귀 테스트 - 뒤로가기/앞으로가기로 filters prop이 바뀌면, 검색창에 아직 제출하지 않은
  // 입력값이 남아있으면 안 된다(제출 안 한 값이 조용히 함께 적용된 것처럼 보이는 것을 방지).
  it('filters prop이 바뀌면(뒤로가기 등) 검색창의 미제출 입력값이 새 필터로 재동기화된다', () => {
    const { rerender } = render(
      <AdminUsersClient
        data={page([])}
        filters={{ email: 'old@example.com', nickname: '', role: '', status: '' }}
        currentUserId={1}
      />,
    );

    const emailInput = screen.getByPlaceholderText('이메일 검색') as HTMLInputElement;
    expect(emailInput.value).toBe('old@example.com');

    // "검색" 버튼은 누르지 않고 입력값만 바꿔둔다(미제출 상태).
    fireEvent.change(emailInput, { target: { value: 'unsubmitted@example.com' } });
    expect(emailInput.value).toBe('unsubmitted@example.com');

    rerender(
      <AdminUsersClient
        data={page([])}
        filters={{ email: 'new@example.com', nickname: '', role: '', status: '' }}
        currentUserId={1}
      />,
    );

    expect(emailInput.value).toBe('new@example.com');
  });

  // 회귀 테스트 - navigateToPage는 검색창의 로컬 state가 아니라 filters prop(마지막으로 실제
  // 적용된 값)을 기준으로 이동해야 한다. 검색창에 새 값을 입력만 하고 "검색"을 누르지 않은 채
  // 페이지 화살표를 클릭해도, 아직 제출 안 한 검색어가 함께 적용되면 안 된다.
  it('페이지 이동은 검색창의 미제출 입력이 아니라 filters prop(적용된 값) 기준으로 이동한다', () => {
    render(
      <AdminUsersClient
        data={page([user({ id: 2 })], { totalPages: 2 })}
        filters={{ email: 'applied@example.com', nickname: '', role: '', status: '' }}
        currentUserId={1}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('이메일 검색'), { target: { value: 'unsubmitted@example.com' } });

    const pageIndicator = screen.getByText('1 / 2');
    const paginationContainer = pageIndicator.parentElement as HTMLElement;
    const [, nextButton] = within(paginationContainer).getAllByRole('button');
    fireEvent.click(nextButton);

    expect(push).toHaveBeenCalledWith(expect.stringContaining('email=applied%40example.com'));
    expect(push.mock.calls[0][0]).not.toContain('unsubmitted');
  });
});
