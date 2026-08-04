'use client';

import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { parsePageParam } from '../../../lib/pageParam';
import { getAdminUsers } from '../../../services/admin';
import { getCurrentUser } from '../../../services/auth';
import { type AdminUserListItemDto, type PageResponseDto } from '../../../types/api';
import { AdminUsersClient } from './AdminUsersClient';

function AdminUsersPageContent() {
  const searchParams = useSearchParams();
  const page = parsePageParam(searchParams.get('page') ?? undefined);
  const email = searchParams.get('email') ?? undefined;
  const nickname = searchParams.get('nickname') ?? undefined;
  const role = searchParams.get('role') ?? undefined;
  const status = searchParams.get('status') ?? undefined;

  const [data, setData] = useState<PageResponseDto<AdminUserListItemDto> | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // 필터/페이지가 바뀌어 이 effect가 재실행될 때만 의미 있는 재설정이다(최초 실행 시 초기값과
    // 동일) - 필터 변경 시 새 로딩 상태를 보여줘야 하므로 의도적으로 동기 호출한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    Promise.all([
      getAdminUsers({ page, email, nickname, role, status }).catch(() => {
        if (!cancelled) setLoadError('유저 목록을 불러오지 못했습니다.');
        return undefined;
      }),
      // admin/layout.tsx가 이미 이 요청의 role을 확인해 통과시켰으므로 여기서 실패할 일은 없다.
      getCurrentUser().then((me) => me.userId),
    ])
      .then(([usersPage, userId]) => {
        if (cancelled) return;
        setData(usersPage);
        setCurrentUserId(userId);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, email, nickname, role, status]);

  if (loading || currentUserId === undefined) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <AdminUsersClient
      data={data}
      loadError={loadError}
      filters={{
        email: email ?? '',
        nickname: nickname ?? '',
        role: role ?? '',
        status: status ?? '',
      }}
      currentUserId={currentUserId}
    />
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      }
    >
      <AdminUsersPageContent />
    </Suspense>
  );
}
