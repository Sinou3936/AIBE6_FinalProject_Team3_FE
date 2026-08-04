'use client';

import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { parsePageParam } from '../../../lib/pageParam';
import { getAdminPropertyReports } from '../../../services/admin';
import { type AdminPropertyReportListItemDto, type PageResponseDto } from '../../../types/api';
import { AdminReportsClient } from './AdminReportsClient';

// status 쿼리파라미터가 아예 없는 최초 진입(북마크/새로고침 포함)은 대기중(RECEIVED) 신고를
// 우선 보여준다. 사용자가 명시적으로 "전체"를 고르면 status=ALL로 남겨 다음 새로고침에서도
// 그 선택이 유지되게 한다(그냥 파라미터를 지우면 다시 RECEIVED로 되돌아가버린다).
function AdminReportsPageContent() {
  const searchParams = useSearchParams();
  const page = parsePageParam(searchParams.get('page') ?? undefined);
  const selectedStatus = searchParams.get('status') ?? 'RECEIVED';
  const apiStatus = selectedStatus === 'ALL' ? undefined : selectedStatus;
  const reason = searchParams.get('reason') ?? undefined;

  const [data, setData] = useState<PageResponseDto<AdminPropertyReportListItemDto> | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // page/status/reason이 바뀌어 이 effect가 재실행될 때만 의미 있는 재설정이다(최초 실행 시
    // 초기값과 동일) - 필터 변경 시 새 로딩 상태를 보여줘야 하므로 의도적으로 동기 호출한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getAdminPropertyReports({ page, status: apiStatus, reason })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setLoadError('신고 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, apiStatus, reason]);

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return <AdminReportsClient data={data} loadError={loadError} filters={{ status: selectedStatus, reason: reason ?? '' }} />;
}

export default function AdminReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      }
    >
      <AdminReportsPageContent />
    </Suspense>
  );
}
