import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const usePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => usePathname(),
}));

import { AdminNav } from './AdminNav';

// 회귀 테스트(2026-08-20) - 활성 탭이 밑줄/글자색으로만 구분돼, 스크린리더 사용자는 "관리자 메뉴"
// 안에서 지금 어느 탭이 열려 있는지 알 방법이 없었다. aria-current="page"로 활성 탭만 표시해야 한다.
describe('AdminNav', () => {
  it('현재 경로에 해당하는 탭에만 aria-current="page"를 붙인다', () => {
    usePathname.mockReturnValue('/admin/users');
    render(<AdminNav />);

    expect(screen.getByRole('link', { name: '유저 관리' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '대시보드' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: '신고 관리' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: '체크리스트 관리' })).not.toHaveAttribute('aria-current');
  });

  // 회귀 테스트(2026-08-20 전수조사) - 활성 여부 판정이 '/admin'만 정확히 일치를 요구하고 나머지
  // 탭은 startsWith로 하위 경로까지 포함하는데, 그 하위 경로(prefix-match) 케이스를 검증하는
  // 테스트가 없었다 - "유저 관리" 탭이 유저 상세 등 하위 경로(/admin/users/5)에서도 계속
  // 활성으로 표시되는지, 그리고 '/admin'만 정확히 일치해야 하는 대시보드 탭은 그 하위 경로에서
  // 활성이 아닌지를 함께 확인한다.
  it('중첩 경로(/admin/users/5)에서도 해당 탭이 계속 활성으로 표시된다', () => {
    usePathname.mockReturnValue('/admin/users/5');
    render(<AdminNav />);

    expect(screen.getByRole('link', { name: '유저 관리' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '대시보드' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: '신고 관리' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: '체크리스트 관리' })).not.toHaveAttribute('aria-current');
  });
});
