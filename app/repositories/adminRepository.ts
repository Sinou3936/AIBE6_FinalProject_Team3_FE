import 'server-only';
import {
  type AdminDashboardStatsDto,
  type AdminPropertyReportDetailDto,
  type AdminPropertyReportListItemDto,
  type AdminPropertyReportReviewRequestDto,
  type AdminPropertyRegistrationCountDto,
  type AdminReportReasonCountDto,
  type AdminRoleDto,
  type AdminStatsTrendPointDto,
  type AdminUserDetailDto,
  type AdminUserListItemDto,
  type AdminUserStatusDto,
  type PageResponseDto,
  type PropertyReportReasonDto,
} from '../types/api';
import {
  initAdminPropertyRegistrations,
  initAdminPropertyReportDetails,
  initAdminPropertyReports,
  initAdminUsers,
} from '../mocks/init/admin';
import { type AdminPropertyReportSearchParams, type AdminUserSearchParams } from '../services/admin';

// PATCH가 상태를 바꾸면 이후 조회에도 반영되어야 하는데, Next.js 개발 서버(Turbopack)는 Route
// Handler와 Server Component 페이지를 서로 다른 모듈 그래프로 컴파일해서, 이 파일도 진입점마다
// 독립적으로 다시 평가된다 - 평범한 모듈 스코프 변수로 두면 각 그래프가 initAdminUsers에서 새로
// 복제한 자기만의 복사본을 갖게 돼 mutation이 서로 안 보인다(실제로 재현 확인함: Route
// Handler로 PATCH 성공 응답을 받아도 페이지를 다시 열면 원래 값으로 보임). Node.js 프로세스
// 전체에서 유일한 globalThis에 붙여두면 어느 모듈 그래프에서 먼저 평가되든 하나의 상태를 공유한다.
type AdminMockState = {
  users: AdminUserListItemDto[];
  reports: AdminPropertyReportListItemDto[];
  reportDetails: Record<number, AdminPropertyReportDetailDto>;
};

const globalForAdminMock = globalThis as typeof globalThis & { __adminMockState?: AdminMockState };

const mockState: AdminMockState = (globalForAdminMock.__adminMockState ??= {
  users: initAdminUsers.map((user) => ({ ...user })),
  reports: initAdminPropertyReports.map((report) => ({ ...report })),
  reportDetails: Object.fromEntries(
    Object.entries(initAdminPropertyReportDetails).map(([id, detail]) => [id, { ...detail }]),
  ),
});

const mockUsers = mockState.users;
const mockReports = mockState.reports;
const mockReportDetails = mockState.reportDetails;
// 매물 등록 이력은 admin 화면에서 수정할 일이 없어 복제하지 않고 init 데이터를 그대로 참조한다.
const mockPropertyRegistrations = initAdminPropertyRegistrations;

const PAGE_SIZE = 20;

function paginate<T>(items: T[], page: number): PageResponseDto<T> {
  const start = page * PAGE_SIZE;
  const content = items.slice(start, start + PAGE_SIZE);
  const totalElements = items.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  return { content, page, size: PAGE_SIZE, totalElements, totalPages, hasNext: start + PAGE_SIZE < totalElements };
}

export function getMockAdminUsers(params: AdminUserSearchParams = {}): PageResponseDto<AdminUserListItemDto> {
  const filtered = mockUsers.filter((user) => {
    if (params.email && !(user.email ?? '').includes(params.email)) return false;
    if (params.nickname && !user.nickname.includes(params.nickname)) return false;
    if (params.role && user.role !== params.role) return false;
    if (params.status && user.status !== params.status) return false;
    return true;
  });
  return paginate(filtered, params.page ?? 0);
}

function toUserDetail(user: AdminUserListItemDto): AdminUserDetailDto {
  return { ...user, profileImageUrl: null, updatedAt: user.createdAt };
}

export function updateMockAdminUserRole(userId: number, role: AdminRoleDto): AdminUserDetailDto | undefined {
  const user = mockUsers.find((candidate) => candidate.id === userId);
  if (!user) return undefined;
  user.role = role;
  return toUserDetail(user);
}

export function updateMockAdminUserStatus(userId: number, status: AdminUserStatusDto): AdminUserDetailDto | undefined {
  const user = mockUsers.find((candidate) => candidate.id === userId);
  if (!user) return undefined;
  user.status = status;
  return toUserDetail(user);
}

export function getMockAdminPropertyReports(
  params: AdminPropertyReportSearchParams = {},
): PageResponseDto<AdminPropertyReportListItemDto> {
  const filtered = mockReports.filter((report) => {
    if (params.status && report.status !== params.status) return false;
    if (params.reason && report.reason !== params.reason) return false;
    return true;
  });
  return paginate(filtered, params.page ?? 0);
}

export function getMockAdminPropertyReportDetail(reportId: number): AdminPropertyReportDetailDto | undefined {
  return mockReportDetails[reportId];
}

export function reviewMockAdminPropertyReport(
  reportId: number,
  request: AdminPropertyReportReviewRequestDto,
): AdminPropertyReportDetailDto | undefined {
  const detail = mockReportDetails[reportId];
  const listItem = mockReports.find((report) => report.id === reportId);
  if (!detail || !listItem) return undefined;

  detail.status = request.status;
  detail.reviewerId = 1;
  detail.reviewedAt = new Date().toISOString().slice(0, 10);
  detail.reviewMemo = request.memo ?? null;
  listItem.status = request.status;
  return detail;
}

export type MockAdminDashboardParams = {
  startDate?: string;
  endDate?: string;
};

const DEFAULT_TREND_DAYS = 14;
const REASONS: PropertyReportReasonDto[] = ['ALREADY_CONTRACTED', 'PRICE_MISMATCH', 'INFO_MISMATCH', 'DUPLICATE', 'ETC'];

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// 실제 백엔드(AdminStatsService)와 동일하게 startDate/endDate 생략 시 오늘 기준 최근 14일을 기본값으로
// 쓴다. Date.now()는 이 일반 함수 안에서만 호출해야 컴포넌트 렌더 중 impure 호출로 오인되지 않는다.
function resolveRange(params: MockAdminDashboardParams): { startDate: string; endDate: string } {
  const endDate = params.endDate || toIsoDate(new Date());
  const startDate = params.startDate || toIsoDate(new Date(Date.now() - (DEFAULT_TREND_DAYS - 1) * 86_400_000));
  return { startDate, endDate };
}

function inRange(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= endDate;
}

function eachDate(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(toIsoDate(cursor));
    cursor = new Date(cursor.getTime() + 86_400_000);
  }
  return dates;
}

function countByDate(dates: string[], recordDates: string[]): AdminStatsTrendPointDto[] {
  return dates.map((date) => ({ date, count: recordDates.filter((recordDate) => recordDate === date).length }));
}

// byPropertyRegistration은 백엔드와 동일하게 "선택한 기간 가입자"를 모집단으로 하는 가입→등록
// 전환율이다 - 등록 여부는 가입 시점 이후 언제든(기간 밖이어도) 매물을 등록했는지로 판단한다.
export function getMockAdminDashboardStats(params: MockAdminDashboardParams = {}): AdminDashboardStatsDto {
  const { startDate, endDate } = resolveRange(params);

  const usersInRange = mockUsers.filter((user) => inRange(user.createdAt, startDate, endDate));
  const registrationsInRange = mockPropertyRegistrations.filter((r) => inRange(r.createdAt, startDate, endDate));
  const reportsInRange = mockReports.filter((report) => inRange(report.createdAt, startDate, endDate));

  const dates = eachDate(startDate, endDate);
  const signups = countByDate(dates, usersInRange.map((user) => user.createdAt));
  const propertyRegistrations = countByDate(dates, registrationsInRange.map((r) => r.createdAt));

  const registeredUserIds = new Set(mockPropertyRegistrations.map((r) => r.userId));
  const joinedUserIds = usersInRange.map((user) => user.id);
  const registeredCount = joinedUserIds.filter((id) => registeredUserIds.has(id)).length;
  const unregisteredCount = joinedUserIds.length - registeredCount;
  const byPropertyRegistration: AdminPropertyRegistrationCountDto[] = [
    { registered: true, count: registeredCount },
    { registered: false, count: unregisteredCount },
  ];

  const byReportReason: AdminReportReasonCountDto[] = REASONS.map((reason) => ({
    reason,
    count: reportsInRange.filter((report) => report.reason === reason).length,
  }));

  return {
    summary: {
      totalUsers: usersInRange.length,
      totalProperties: registrationsInRange.length,
      pendingReports: reportsInRange.filter((report) => report.status === 'RECEIVED').length,
    },
    trends: { signups, propertyRegistrations },
    distributions: { byPropertyRegistration, byReportReason },
  };
}
