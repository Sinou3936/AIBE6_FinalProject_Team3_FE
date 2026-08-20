import { useMockData } from '../config/dataSource';
import { requestJson } from '../lib/api/http';
import {
  getMockAdminChecklistItemTemplates,
  getMockAdminChecklistTemplateImages,
  getMockAdminDashboardStats,
  getMockAdminPropertyReports,
  getMockAdminUsers,
} from '../repositories/adminRepository';
import {
  type AdminChecklistItemTemplateDto,
  type AdminChecklistItemTemplateImageDto,
  type AdminDashboardStatsDto,
  type AdminPropertyReportListItemDto,
  type AdminUserListItemDto,
  type PageResponseDto,
} from '../types/api';

// 이 파일은 GET 전용이고 admin/*.tsx page들에서 호출된다 - mutation/단건 조회는
// adminActions.ts에 분리되어 있다(그 파일의 주석 참고). admin/*.tsx가 크로스오리진 배포
// 대응으로 전부 Client Component가 되면서(2026-08-04) 이 파일도 이제 page.tsx가 아니라
// 'use client' 컴포넌트에서 직접 호출되고, adminRepository.ts의 mock repository/init 데이터도
// 브라우저 번들에 포함된다(mock 데이터는 민감하지 않은 로컬 개발용 시드값이라 문제없다 -
// adminRepository.ts 상단 주석 참고).
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
  // 목록 조회 도중 필터가 바뀌거나 화면을 벗어나면(admin/users/page.tsx) 호출부가 이 fetch
  // 자체를 중단할 수 있어야 한다 - signal이 없으면 이미 관심 없어진 요청이 계속 진행되다가
  // 뒤늦게 도착해 그사이 바뀐 화면의 state를 오염시키거나(clampToValidPage의 router.replace가
  // 이미 다른 페이지로 이동한 뒤에 실행되는 등), 서버 자원만 불필요하게 소모한다
  // (2026-08-20 전수조사에서 지적).
  signal?: AbortSignal,
): Promise<PageResponseDto<AdminUserListItemDto>> {
  if (useMockData) {
    return getMockAdminUsers(params);
  }
  const path = `/admin/users${toQueryString(params)}`;
  return requestJson<PageResponseDto<AdminUserListItemDto>>(path, { signal });
}

export type AdminPropertyReportSearchParams = {
  page?: number;
  status?: string;
  reason?: string;
};

export async function getAdminPropertyReports(
  params: AdminPropertyReportSearchParams = {},
  // 위 getAdminUsers와 동일한 이유(admin/reports/page.tsx).
  signal?: AbortSignal,
): Promise<PageResponseDto<AdminPropertyReportListItemDto>> {
  if (useMockData) {
    return getMockAdminPropertyReports(params);
  }
  const path = `/admin/property-reports${toQueryString(params)}`;
  return requestJson<PageResponseDto<AdminPropertyReportListItemDto>>(path, { signal });
}

export type AdminDashboardStatsParams = {
  startDate?: string;
  endDate?: string;
};

export async function getAdminDashboardStats(params: AdminDashboardStatsParams = {}): Promise<AdminDashboardStatsDto> {
  if (useMockData) {
    return getMockAdminDashboardStats(params);
  }
  const path = `/admin/stats/dashboard${toQueryString(params)}`;
  return requestJson<AdminDashboardStatsDto>(path);
}

export async function getAdminChecklistItemTemplates(): Promise<AdminChecklistItemTemplateDto[]> {
  if (useMockData) {
    return getMockAdminChecklistItemTemplates();
  }
  return requestJson<AdminChecklistItemTemplateDto[]>('/admin/checklist-templates');
}

export async function getAdminChecklistTemplateImages(
  templateId: number,
): Promise<AdminChecklistItemTemplateImageDto[]> {
  if (useMockData) {
    return getMockAdminChecklistTemplateImages(templateId);
  }
  return requestJson<AdminChecklistItemTemplateImageDto[]>(`/admin/checklist-templates/${templateId}/images`);
}
