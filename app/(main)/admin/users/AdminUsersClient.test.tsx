import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { type AdminUserListItemDto, type PageResponseDto } from '../../../types/api';
import { AdminUsersClient } from './AdminUsersClient';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
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

function page(content: AdminUserListItemDto[]): PageResponseDto<AdminUserListItemDto> {
  return { content, page: 0, size: 20, totalPages: 1, totalElements: content.length, hasNext: false };
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
});
