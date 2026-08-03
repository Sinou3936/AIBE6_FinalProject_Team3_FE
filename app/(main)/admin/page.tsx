import { cookies } from 'next/headers';
import { getAdminDashboardStats } from '../../services/admin';
import { type AdminDashboardStatsDto } from '../../types/api';
import { AdminDashboardClient } from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

const DEFAULT_RANGE_DAYS = 14;

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// 서버가 어느 타임존에서 돌든 "지금 한국 날짜가 며칠인지"만 필요해서, UTC 시각에 9시간을 더한 뒤
// toISOString()으로 날짜만 뽑는다 - Asia/Seoul 캘린더 날짜를 구하는 방식이다. new Date()/Date.now()
// 호출을 컴포넌트 본문이 아니라 이 일반 함수 안에 둬야 react-hooks/purity 규칙에 걸리지 않는다.
function defaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const start = new Date(end.getTime() - (DEFAULT_RANGE_DAYS - 1) * 86_400_000);
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
}

type PageProps = {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
};

export default async function AdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieHeader = (await cookies()).toString();

  const defaults = defaultDateRange();
  const startDate = params.startDate?.trim() || defaults.startDate;
  const endDate = params.endDate?.trim() || defaults.endDate;

  let stats: AdminDashboardStatsDto | undefined;
  let loadError: string | undefined;

  try {
    stats = await getAdminDashboardStats({ startDate, endDate }, cookieHeader);
  } catch {
    loadError = '통계를 불러오지 못했습니다. 조회 기간을 확인해주세요.';
  }

  return <AdminDashboardClient stats={stats} loadError={loadError} startDate={startDate} endDate={endDate} />;
}
