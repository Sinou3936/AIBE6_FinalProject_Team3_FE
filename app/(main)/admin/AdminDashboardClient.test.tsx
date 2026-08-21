import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type AdminDashboardStatsDto } from '../../types/api';
import { AdminDashboardClient, buildTrendData } from './AdminDashboardClient';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
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

describe('buildTrendData', () => {
  // 회귀 테스트 - 두 시계열을 배열 인덱스로 짝지으면, propertyRegistrations가 signups와 길이/순서가
  // 다를 때(예: 특정 날짜에 매물등록 데이터가 아예 없어 배열에서 빠진 경우) 엉뚱한 날짜의 값이
  // 매칭돼버린다. 실제 date 값으로 맞춰야 이런 경우에도 값이 밀리지 않는다.
  it('두 시계열의 길이/순서가 달라도 날짜 기준으로 값을 맞춘다', () => {
    const trends = {
      signups: [
        { date: '2026-01-01', count: 3 },
        { date: '2026-01-02', count: 5 },
        { date: '2026-01-03', count: 2 },
      ],
      // 1/2 데이터가 통째로 빠져 있다 - 인덱스로 매칭하면 1/3의 값(4)이 1/2 자리에 잘못 들어간다.
      propertyRegistrations: [
        { date: '2026-01-01', count: 1 },
        { date: '2026-01-03', count: 4 },
      ],
    };

    const result = buildTrendData(trends);

    expect(result).toEqual([
      { date: '01/01', 가입자: 3, 매물등록: 1 },
      { date: '01/02', 가입자: 5, 매물등록: 0 },
      { date: '01/03', 가입자: 2, 매물등록: 4 },
    ]);
  });
});

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

  it('선택한 기간에 접수된 신고가 없으면 막대그래프 대신 빈 상태 안내를 보여준다', () => {
    render(
      <AdminDashboardClient stats={stats({ byReportReason: [] })} startDate="2026-01-01" endDate="2026-01-14" />,
    );

    expect(screen.getByText('신고 데이터가 없습니다.')).toBeInTheDocument();
  });

  it('신고 데이터가 있으면 빈 상태 안내 대신 막대그래프를 보여준다', () => {
    render(
      <AdminDashboardClient
        stats={stats({ byReportReason: [{ reason: 'PRICE_MISMATCH', count: 3 }] })}
        startDate="2026-01-01"
        endDate="2026-01-14"
      />,
    );

    expect(screen.queryByText('신고 데이터가 없습니다.')).not.toBeInTheDocument();
  });

  it('로딩 실패 시 loadError 메시지를 보여주고 통계 영역은 렌더링하지 않는다', () => {
    render(<AdminDashboardClient loadError="통계를 불러오지 못했습니다." startDate="2026-01-01" endDate="2026-01-14" />);

    expect(screen.getByText('통계를 불러오지 못했습니다.')).toBeInTheDocument();
    expect(screen.queryByText('신규 가입자')).not.toBeInTheDocument();
  });

  it('기간을 바꾸고 조회를 누르면 startDate/endDate 쿼리로 /admin에 push한다', () => {
    render(<AdminDashboardClient stats={stats()} startDate="2026-01-01" endDate="2026-01-14" />);

    fireEvent.change(screen.getByLabelText('시작일'), { target: { value: '2026-02-01' } });
    fireEvent.change(screen.getByLabelText('종료일'), { target: { value: '2026-02-14' } });
    fireEvent.click(screen.getByRole('button', { name: '조회' }));

    expect(push).toHaveBeenCalledWith('/admin?startDate=2026-02-01&endDate=2026-02-14');
  });

  // 뒤로가기/앞으로가기로 startDate/endDate prop만 바뀌고 컴포넌트가 언마운트되지 않는 경우를
  // 재현한다 - 날짜 입력창의 로컬 state가 새 prop으로 재동기화돼야 한다.
  it('startDate/endDate prop이 바뀌면(뒤로가기 등) 날짜 입력창 값도 갱신된다', () => {
    const { rerender } = render(
      <AdminDashboardClient stats={stats()} startDate="2026-01-01" endDate="2026-01-14" />,
    );

    expect((screen.getByLabelText('시작일') as HTMLInputElement).value).toBe('2026-01-01');

    rerender(<AdminDashboardClient stats={stats()} startDate="2026-02-01" endDate="2026-02-14" />);

    expect((screen.getByLabelText('시작일') as HTMLInputElement).value).toBe('2026-02-01');
    expect((screen.getByLabelText('종료일') as HTMLInputElement).value).toBe('2026-02-14');
  });
});
