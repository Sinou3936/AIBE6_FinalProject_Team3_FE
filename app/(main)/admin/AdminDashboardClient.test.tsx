import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type AdminDashboardStatsDto } from '../../types/api';
import { AdminDashboardClient } from './AdminDashboardClient';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Recharts의 ResponsiveContainer가 jsdom에 없는 ResizeObserver를 요구한다 - 이 파일에서만
// 필요한 최소 stub이라 전역 vitest.setup.ts에는 추가하지 않는다.
beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

function stats(overrides: Partial<AdminDashboardStatsDto['distributions']> = {}): AdminDashboardStatsDto {
  return {
    summary: { newUsers: 0, newProperties: 0, newPendingReports: 0 },
    trends: { signups: [{ date: '2026-01-01', count: 0 }], propertyRegistrations: [{ date: '2026-01-01', count: 0 }] },
    distributions: {
      byPropertyRegistration: [
        { registered: true, count: 0 },
        { registered: false, count: 0 },
      ],
      byReportReason: [],
      ...overrides,
    },
  };
}

describe('AdminDashboardClient', () => {
  // 회귀 테스트 - 신고 사유별 분포(막대그래프)는 전부 0일 때 빈 상태 안내를 보여주는데,
  // 바로 옆 매물 등록 여부별 유저 분포(파이그래프)만 같은 처리가 없어서 선택한 기간에 신규
  // 가입자가 0명이면 Recharts가 총합 0으로 슬라이스 각도를 나누다 깨진 도넛을 그렸다.
  it('선택한 기간에 신규 가입자가 없으면 파이차트 대신 빈 상태 안내를 보여준다', () => {
    render(
      <AdminDashboardClient
        stats={stats({
          byPropertyRegistration: [
            { registered: true, count: 0 },
            { registered: false, count: 0 },
          ],
        })}
        startDate="2026-01-01"
        endDate="2026-01-14"
      />,
    );

    expect(screen.getByText('선택한 기간에 가입한 사람이 없습니다.')).toBeInTheDocument();
  });

  it('데이터가 있으면 빈 상태 안내 대신 파이차트를 보여준다', () => {
    render(
      <AdminDashboardClient
        stats={stats({
          byPropertyRegistration: [
            { registered: true, count: 4 },
            { registered: false, count: 6 },
          ],
        })}
        startDate="2026-01-01"
        endDate="2026-01-14"
      />,
    );

    expect(screen.queryByText('선택한 기간에 가입한 사람이 없습니다.')).not.toBeInTheDocument();
  });
});
