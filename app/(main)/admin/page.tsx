'use client';

import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { resolveErrorMessage } from '../../lib/resolveErrorMessage';
import { getAdminDashboardStats } from '../../services/admin';
import { type AdminDashboardStatsDto } from '../../types/api';
import { AdminDashboardClient } from './AdminDashboardClient';

const DEFAULT_RANGE_DAYS = 14;

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// "지금 한국 날짜가 며칠인지"만 필요해서, UTC 시각에 9시간을 더한 뒤 toISOString()으로 날짜만
// 뽑는다 - Asia/Seoul 캘린더 날짜를 구하는 방식이다.
function defaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const start = new Date(end.getTime() - (DEFAULT_RANGE_DAYS - 1) * 86_400_000);
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
}

function AdminPageContent() {
  const searchParams = useSearchParams();
  const defaults = defaultDateRange();
  const startDate = searchParams.get('startDate')?.trim() || defaults.startDate;
  const endDate = searchParams.get('endDate')?.trim() || defaults.endDate;

  const [stats, setStats] = useState<AdminDashboardStatsDto | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // URL을 직접 조작(예: ?startDate=2026-09-01&endDate=2026-08-01)하면 폼의 min/max 검증을 거치지
  // 않고 이 값이 바로 여기까지 들어온다 - 검증 없이 그대로 조회하면 eachDate()의 while(cursor <= end)
  // 조건이 첫 반복부터 거짓이 되어 추이/분포가 전부 빈 배열로 나오고, 화면은 이걸 "그 기간에 데이터
  // 없음"과 구분 없이 똑같이 보여준다 - 관리자는 기간 자체가 잘못됐다는 걸 알 방법이 없다.
  const invalidRange = startDate > endDate;

  useEffect(() => {
    let cancelled = false;
    if (invalidRange) {
      // startDate/endDate가 바뀌어 이 effect가 재실행될 때만 의미 있는 재설정이다 - 잘못된 기간을
      // 알려야 하므로 의도적으로 동기 호출한다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadError('조회 시작일이 종료일보다 늦습니다. 기간을 다시 선택해주세요.');
      setStats(undefined);
      setLoading(false);
      return;
    }
    // startDate/endDate가 바뀌어 이 effect가 재실행될 때만 의미 있는 재설정이다(최초 실행 시
    // 초기값과 동일) - 조회 기간 변경 시 새 로딩 상태를 보여줘야 하므로 의도적으로 동기 호출한다.
    setLoading(true);
    getAdminDashboardStats({ startDate, endDate })
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          setLoadError(undefined);
        }
      })
      .catch((error) => {
        if (!cancelled)
          setLoadError(resolveErrorMessage(error, '통계를 불러오지 못했습니다. 조회 기간을 확인해주세요.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, invalidRange]);

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <span className="sr-only">로딩 중</span>
      </div>
    );
  }

  return <AdminDashboardClient stats={stats} loadError={loadError} startDate={startDate} endDate={endDate} />;
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <span className="sr-only">로딩 중</span>
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
