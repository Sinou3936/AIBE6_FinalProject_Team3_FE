import { cookies } from 'next/headers';
import { getAdminUsers } from '../../../services/admin';
import { type AdminUserListItemDto, type PageResponseDto } from '../../../types/api';
import { AdminUsersClient } from './AdminUsersClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ page?: string; email?: string; nickname?: string; role?: string; status?: string }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieHeader = (await cookies()).toString();
  const page = params.page ? Number(params.page) : 0;

  let data: PageResponseDto<AdminUserListItemDto> | undefined;
  let loadError: string | undefined;

  try {
    data = await getAdminUsers(
      { page, email: params.email, nickname: params.nickname, role: params.role, status: params.status },
      cookieHeader,
    );
  } catch {
    loadError = '유저 목록을 불러오지 못했습니다.';
  }

  return (
    <AdminUsersClient
      data={data}
      loadError={loadError}
      filters={{
        email: params.email ?? '',
        nickname: params.nickname ?? '',
        role: params.role ?? '',
        status: params.status ?? '',
      }}
    />
  );
}
