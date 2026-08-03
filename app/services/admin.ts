import { useMockData } from '../config/dataSource';
import { requestJson } from '../lib/api/http';
import { getMockAdminDashboardStats, getMockAdminPropertyReports, getMockAdminUsers } from '../repositories/adminRepository';
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

// mock 모드에서 'use client' 컴포넌트가 부르는 admin mutation/단건 조회는 이 Route Handler를
// 거친다 - adminRepository.ts를 브라우저에서 직접 호출하면 서버(Server Component)가 읽는
// 모듈 인스턴스와 다른 복사본을 바꾸게 돼서, router.refresh() 후 반영되지 않기 때문이다.
async function postMockAdminAction<T>(body: unknown): Promise<T> {
  const response = await fetch('/api/mock/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? '요청을 처리하지 못했습니다.');
  }
  return response.json();
}

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

export async function updateAdminUserRole(
  userId: number,
  request: AdminUserRoleUpdateRequestDto,
): Promise<AdminUserDetailDto> {
  if (useMockData) {
    return postMockAdminAction<AdminUserDetailDto>({ action: 'USER_ROLE', userId, role: request.role });
  }
  return requestJson<AdminUserDetailDto>(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
}

export async function updateAdminUserStatus(
  userId: number,
  request: AdminUserStatusUpdateRequestDto,
): Promise<AdminUserDetailDto> {
  if (useMockData) {
    return postMockAdminAction<AdminUserDetailDto>({ action: 'USER_STATUS', userId, status: request.status });
  }
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
  if (useMockData) {
    return getMockAdminPropertyReports(params);
  }
  const path = `/admin/property-reports${toQueryString(params)}`;
  return requestJson<PageResponseDto<AdminPropertyReportListItemDto>>(
    path,
    cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined,
  );
}

export async function getAdminPropertyReportDetail(reportId: number): Promise<AdminPropertyReportDetailDto> {
  if (useMockData) {
    return postMockAdminAction<AdminPropertyReportDetailDto>({ action: 'REPORT_DETAIL', reportId });
  }
  return requestJson<AdminPropertyReportDetailDto>(`/admin/property-reports/${reportId}`);
}

export async function reviewAdminPropertyReport(
  reportId: number,
  request: AdminPropertyReportReviewRequestDto,
): Promise<AdminPropertyReportDetailDto> {
  if (useMockData) {
    return postMockAdminAction<AdminPropertyReportDetailDto>({ action: 'REPORT_REVIEW', reportId, request });
  }
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
  if (useMockData) {
    return getMockAdminDashboardStats(params);
  }
  const path = `/admin/stats/dashboard${toQueryString(params)}`;
  return requestJson<AdminDashboardStatsDto>(path, cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined);
}
