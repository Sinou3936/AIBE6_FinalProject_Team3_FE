import { cookies } from 'next/headers';
import { getAdminDashboardStats } from '../../services/admin';
import { type AdminDashboardStatsDto } from '../../types/api';
import { AdminDashboardClient } from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

const DEFAULT_RANGE_DAYS = 14;

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

type PageProps = {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
};

export default async function AdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieHeader = (await cookies()).toString();

  const endDate = params.endDate ?? toIsoDate(new Date());
  const startDate = params.startDate ?? toIsoDate(new Date(Date.now() - (DEFAULT_RANGE_DAYS - 1) * 86_400_000));

  let stats: AdminDashboardStatsDto | undefined;
  let loadError: string | undefined;

  try {
    stats = await getAdminDashboardStats({ startDate, endDate }, cookieHeader);
  } catch {
    loadError = '통계를 불러오지 못했습니다. 조회 기간을 확인해주세요.';
  }

  return <AdminDashboardClient stats={stats} loadError={loadError} startDate={startDate} endDate={endDate} />;
}
