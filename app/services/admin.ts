import { requestJson } from '../lib/api/http';
import {
  type AdminDashboardStatsDto,
  type AdminPropertyReportDetailDto,
  type AdminPropertyReportListItemDto,
  type AdminPropertyReportReviewRequestDto,
  type AdminUserDetailDto,
  type AdminUserListItemDto,
  type AdminUserRoleUpdateRequestDto,
  type AdminUserStatusUpdateRequestDto,
  type PageResponseDto,
} from '../types/api';

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
  const path = `/admin/users${toQueryString(params)}`;
  return requestJson<PageResponseDto<AdminUserListItemDto>>(
    path,
    cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined,
  );
}

export async function updateAdminUserRole(
  userId: number,
  request: AdminUserRoleUpdateRequestDto,
): Promise<AdminUserDetailDto> {
  return requestJson<AdminUserDetailDto>(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
}

export async function updateAdminUserStatus(
  userId: number,
  request: AdminUserStatusUpdateRequestDto,
): Promise<AdminUserDetailDto> {
  return requestJson<AdminUserDetailDto>(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
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
  const path = `/admin/property-reports${toQueryString(params)}`;
  return requestJson<PageResponseDto<AdminPropertyReportListItemDto>>(
    path,
    cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined,
  );
}

export async function getAdminPropertyReportDetail(reportId: number): Promise<AdminPropertyReportDetailDto> {
  return requestJson<AdminPropertyReportDetailDto>(`/admin/property-reports/${reportId}`);
}

export async function reviewAdminPropertyReport(
  reportId: number,
  request: AdminPropertyReportReviewRequestDto,
): Promise<AdminPropertyReportDetailDto> {
  return requestJson<AdminPropertyReportDetailDto>(`/admin/property-reports/${reportId}/review`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
}

export type AdminDashboardStatsParams = {
  startDate?: string;
  endDate?: string;
};

export async function getAdminDashboardStats(
  params: AdminDashboardStatsParams = {},
  cookieHeader?: string,
): Promise<AdminDashboardStatsDto> {
  const path = `/admin/stats/dashboard${toQueryString(params)}`;
  return requestJson<AdminDashboardStatsDto>(path, cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined);
}
