import { cookies } from 'next/headers';
import { getAdminDashboardStats } from '../../services/admin';
import { type AdminDashboardStatsDto } from '../../types/api';
import { AdminDashboardClient } from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieHeader = (await cookies()).toString();

  let stats: AdminDashboardStatsDto | undefined;
  let loadError: string | undefined;

  try {
    stats = await getAdminDashboardStats(cookieHeader);
  } catch {
    loadError = '통계를 불러오지 못했습니다.';
  }

  return <AdminDashboardClient stats={stats} loadError={loadError} />;
}
