import { useMockData } from '../config/dataSource';
import { requestJson } from '../lib/api/http';
import {
  type AdminChecklistItemTemplateCreateRequestDto,
  type AdminChecklistItemTemplateDto,
  type AdminChecklistItemTemplateUpdateRequestDto,
  type AdminPropertyReportDetailDto,
  type AdminPropertyReportReviewRequestDto,
  type AdminUserDetailDto,
  type AdminUserRoleUpdateRequestDto,
  type AdminUserStatusUpdateRequestDto,
} from '../types/api';

// admin.ts(GET 전용, page.tsx에서만 호출)와 파일을 분리해둔 이유: 이 파일의 함수들은
// 'use client' 컴포넌트(AdminUsersClient/AdminReportsClient)에서 직접 호출되므로 브라우저
// 번들에 포함된다. adminRepository.ts를 여기서 import하면 mock repository/init 데이터까지
// 브라우저 번들에 딸려가므로, 이 파일은 adminRepository.ts를 전혀 참조하지 않고 항상
// app/api/mock/admin Route Handler를 fetch로만 호출한다(서버 쪽 mock 상태와 동일한 인스턴스를
// 건드리기 위한 이유는 adminRepository.ts의 globalThis 주석 참고).
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

export async function createAdminChecklistItemTemplate(
  request: AdminChecklistItemTemplateCreateRequestDto,
): Promise<AdminChecklistItemTemplateDto> {
  if (useMockData) {
    return postMockAdminAction<AdminChecklistItemTemplateDto>({ action: 'CHECKLIST_TEMPLATE_CREATE', request });
  }
  return requestJson<AdminChecklistItemTemplateDto>('/admin/checklist-templates', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function updateAdminChecklistItemTemplate(
  templateId: number,
  request: AdminChecklistItemTemplateUpdateRequestDto,
): Promise<AdminChecklistItemTemplateDto> {
  if (useMockData) {
    return postMockAdminAction<AdminChecklistItemTemplateDto>({
      action: 'CHECKLIST_TEMPLATE_UPDATE',
      templateId,
      request,
    });
  }
  return requestJson<AdminChecklistItemTemplateDto>(`/admin/checklist-templates/${templateId}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
}

export async function deleteAdminChecklistItemTemplate(templateId: number): Promise<void> {
  if (useMockData) {
    await postMockAdminAction<{ ok: true }>({ action: 'CHECKLIST_TEMPLATE_DELETE', templateId });
    return;
  }
  await requestJson<void>(`/admin/checklist-templates/${templateId}`, { method: 'DELETE' });
}
