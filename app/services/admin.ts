import { useMockData } from '../config/dataSource';
import { requestJson } from '../lib/api/http';
import {
  getMockAdminChecklistItemTemplates,
  getMockAdminDashboardStats,
  getMockAdminPropertyReports,
  getMockAdminUsers,
} from '../repositories/adminRepository';
import {
  type AdminChecklistItemTemplateDto,
  type AdminDashboardStatsDto,
  type AdminPropertyReportListItemDto,
  type AdminUserListItemDto,
  type PageResponseDto,
} from '../types/api';

// 이 파일은 GET 전용이고 page.tsx(Server Component)에서만 호출된다 - mutation/단건 조회는
// adminActions.ts에 분리되어 있다(그 파일의 주석 참고). adminRepository.ts를 이 파일에서만
// import하도록 유지해야 mock repository/init 데이터가 브라우저 번들에 딸려가지 않는다.
export type AdminUserSearchParams = {
  page?: number;
  email?: string;
  nickname?: string;
  role?: string;
  status?: string;
};

function toQueryString(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export async function getAdminUsers(
  params: AdminUserSearchParams = {},
  cookieHeader?: string,
): Promise<PageResponseDto<AdminUserListItemDto>> {
  if (useMockData) {
    return getMockAdminUsers(params);
  }
  const path = `/admin/users${toQueryString(params)}`;
  return requestJson<PageResponseDto<AdminUserListItemDto>>(
    path,
    cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined,
  );
}

export type AdminPropertyReportSearchParams = {
  page?: number;
  status?: string;
  reason?: string;
};

export async function getAdminPropertyReports(
  params: AdminPropertyReportSearchParams = {},
  cookieHeader?: string,
): Promise<PageResponseDto<AdminPropertyReportListItemDto>> {
  if (useMockData) {
    return getMockAdminPropertyReports(params);
  }
  const path = `/admin/property-reports${toQueryString(params)}`;
  return requestJson<PageResponseDto<AdminPropertyReportListItemDto>>(
    path,
    cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined,
  );
}

export type AdminDashboardStatsParams = {
  startDate?: string;
  endDate?: string;
};

export async function getAdminDashboardStats(
  params: AdminDashboardStatsParams = {},
  cookieHeader?: string,
): Promise<AdminDashboardStatsDto> {
  if (useMockData) {
    return getMockAdminDashboardStats(params);
  }
  const path = `/admin/stats/dashboard${toQueryString(params)}`;
  return requestJson<AdminDashboardStatsDto>(path, cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined);
}

export async function getAdminChecklistItemTemplates(cookieHeader?: string): Promise<AdminChecklistItemTemplateDto[]> {
  if (useMockData) {
    return getMockAdminChecklistItemTemplates();
  }
  return requestJson<AdminChecklistItemTemplateDto[]>(
    '/admin/checklist-templates',
    cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined,
  );
}
