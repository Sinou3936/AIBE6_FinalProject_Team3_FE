import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/users',
}));

import { AdminNav } from './AdminNav';

// 회귀 테스트(2026-08-20) - 활성 탭이 밑줄/글자색으로만 구분돼, 스크린리더 사용자는 "관리자 메뉴"
// 안에서 지금 어느 탭이 열려 있는지 알 방법이 없었다. aria-current="page"로 활성 탭만 표시해야 한다.
describe('AdminNav', () => {
  it('현재 경로에 해당하는 탭에만 aria-current="page"를 붙인다', () => {
    render(<AdminNav />);

    expect(screen.getByRole('link', { name: '유저 관리' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '대시보드' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: '신고 관리' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: '체크리스트 관리' })).not.toHaveAttribute('aria-current');
  });
});
