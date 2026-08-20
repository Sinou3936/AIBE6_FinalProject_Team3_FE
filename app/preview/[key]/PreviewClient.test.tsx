import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PreviewClient } from './PreviewClient';

const isLoggedIn = vi.fn();
vi.mock('../../services/auth', () => ({
  isLoggedIn: (...args: unknown[]) => isLoggedIn(...args),
}));

describe('PreviewClient', () => {
  // 회귀 테스트(2026-08-20 멘토링 피드백) - "내용이 단조롭고 별거 없어 보여 회원가입할 것 같지
  // 않다"는 지적에 각 탭의 예시 항목 수를 늘렸다. 항목 수가 실수로 다시 줄어드는 걸 막기 위해
  // 실제 렌더링된 개수를 확인한다(허위매물 의심 신호 3종은 실제로 켜져 있는 신호 종류와 맞춰야
  // 하므로 개수 자체가 의미가 있다 - RiskSignalType 4종 중 SAME_ACCOUNT_MULTIPLE은 기본
  // 비활성화라 제외).
  it('매물 탭은 매물 정보 카드와 5건의 비교 매물을 보여준다', () => {
    isLoggedIn.mockResolvedValue(false);
    render(<PreviewClient demoKey="market" />);

    expect(screen.getAllByText('역삼동 ○○아파트 84㎡').length).toBeGreaterThan(0);
    expect(screen.getByText('시세보다 15% 높은 가격이에요')).toBeInTheDocument();
    expect(screen.getByText('인근 실거래 비교 매물')).toBeInTheDocument();
  });

  it('계약서 탭은 확인 필요/참고 조항 개수가 실제 표시된 카드 수와 일치한다', () => {
    isLoggedIn.mockResolvedValue(false);
    render(<PreviewClient demoKey="contract" />);

    const requiredBadges = screen.getAllByText('확인 필요');
    const referenceBadges = screen.getAllByText('참고');
    // 상단 요약 그리드의 라벨(각 1개)과 조항 카드의 Badge(확인 필요 3개 + 참고 2개)를 합친 값이다.
    expect(requiredBadges.length).toBe(1 + 3);
    expect(referenceBadges.length).toBe(1 + 2);
    expect(screen.getByText('5개')).toBeInTheDocument(); // 총 조항 수
  });

  it('보증금 탭은 실제로 켜져 있는 의심 신호 3종만 보여준다', () => {
    isLoggedIn.mockResolvedValue(false);
    render(<PreviewClient demoKey="deposit" />);

    expect(screen.getByText('3개 발견')).toBeInTheDocument();
    expect(screen.getByText('가격 이상 신호')).toBeInTheDocument();
    expect(screen.getByText('중복 등록 의심')).toBeInTheDocument();
    expect(screen.getByText('단기 재등록 의심')).toBeInTheDocument();
    // 아직 꺼져 있는 기능(동일 계정 다중 등록)은 예시에 없어야 한다.
    expect(screen.queryByText(/동일 계정/)).not.toBeInTheDocument();
  });

  it('체크리스트 탭은 실제 5개 카테고리를 전부 보여준다', () => {
    isLoggedIn.mockResolvedValue(false);
    render(<PreviewClient demoKey="checklist" />);

    for (const category of ['실내 상태', '소음·환경', '보안·안전', '서류·행정', '주변 환경']) {
      expect(screen.getAllByText(category).length).toBeGreaterThan(0);
    }
  });
});
