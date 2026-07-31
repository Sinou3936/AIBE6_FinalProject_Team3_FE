import { cookies } from 'next/headers';
import { getAdminPropertyReports } from '../../../services/admin';
import { type AdminPropertyReportListItemDto, type PageResponseDto } from '../../../types/api';
import { AdminReportsClient } from './AdminReportsClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ page?: string; status?: string; reason?: string }>;
};

// status 쿼리파라미터가 아예 없는 최초 진입(북마크/새로고침 포함)은 대기중(RECEIVED) 신고를
// 우선 보여준다. 사용자가 명시적으로 "전체"를 고르면 status=ALL로 남겨 다음 새로고침에서도
// 그 선택이 유지되게 한다(그냥 파라미터를 지우면 다시 RECEIVED로 되돌아가버림).
export default async function AdminReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieHeader = (await cookies()).toString();
  const page = params.page ? Number(params.page) : 0;
  const selectedStatus = params.status ?? 'RECEIVED';
  const apiStatus = selectedStatus === 'ALL' ? undefined : selectedStatus;

  let data: PageResponseDto<AdminPropertyReportListItemDto> | undefined;
  let loadError: string | undefined;

  try {
    data = await getAdminPropertyReports({ page, status: apiStatus, reason: params.reason }, cookieHeader);
  } catch {
    loadError = '신고 목록을 불러오지 못했습니다.';
  }

  return (
    <AdminReportsClient
      data={data}
      loadError={loadError}
      filters={{ status: selectedStatus, reason: params.reason ?? '' }}
    />
  );
}
