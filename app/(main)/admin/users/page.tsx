import { cookies } from 'next/headers';
import { parsePageParam } from '../../../lib/pageParam';
import { getAdminUsers } from '../../../services/admin';
import { getCurrentUser } from '../../../services/auth';
import { type AdminUserListItemDto, type PageResponseDto } from '../../../types/api';
import { AdminUsersClient } from './AdminUsersClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ page?: string; email?: string; nickname?: string; role?: string; status?: string }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieHeader = (await cookies()).toString();
  const page = parsePageParam(params.page);

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

  // admin/layout.tsx가 이미 이 요청의 role을 확인해 통과시켰으므로 여기서 실패할 일은 없다.
  const { userId: currentUserId } = await getCurrentUser(cookieHeader);

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
      currentUserId={currentUserId}
    />
  );
}
