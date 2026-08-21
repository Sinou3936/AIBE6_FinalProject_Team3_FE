import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('totalPages가 1 이하면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<Pagination page={0} totalPages={1} onPageChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('현재 페이지/전체 페이지 수를 보여주고, 첫/마지막 페이지에서는 해당 버튼이 비활성화된다', () => {
    render(<Pagination page={0} totalPages={3} onPageChange={vi.fn()} />);

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이전 페이지' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '다음 페이지' })).not.toBeDisabled();
  });

  // 회귀 테스트(2026-08-20 전수조사) - 페이지 숫자만 바뀌고 컴포넌트 자체는 그대로라 화면을 보는
  // 사용자는 바로 알아채지만, 스크린리더 사용자에게는 이 변화를 알려줄 방법이 없었다.
  it('페이지 표시에 aria-live가 붙어 있다', () => {
    render(<Pagination page={0} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByText('1 / 3')).toHaveAttribute('aria-live', 'polite');
  });

  // 회귀 테스트(2026-08-20 전수조사) - 마지막에서 두 번째 페이지에서 "다음"을 눌러 마지막
  // 페이지로 넘어가면, 방금 클릭해 포커스를 갖고 있던 그 버튼이 disabled로 바뀌면서 브라우저가
  // 강제로 blur시켜 키보드 포커스가 body로 떨어졌다. 남아있는(활성 상태인) 반대쪽 버튼으로
  // 포커스가 되돌아가야 한다.
  it('클릭한 버튼이 disabled가 되면 포커스를 남아있는 버튼으로 되돌린다', () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination page={0} totalPages={2} onPageChange={onPageChange} />);

    const nextButton = screen.getByRole('button', { name: '다음 페이지' });
    nextButton.focus();
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(1);

    // 실제 부모 컴포넌트라면 onPageChange 콜백을 받아 page state를 바꿔 리렌더한다.
    rerender(<Pagination page={1} totalPages={2} onPageChange={onPageChange} />);

    expect(screen.getByRole('button', { name: '다음 페이지' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '이전 페이지' })).toHaveFocus();
  });

  it('이전 페이지 버튼을 눌러 첫 페이지가 되어도 동일하게 포커스가 되돌아간다', () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination page={1} totalPages={2} onPageChange={onPageChange} />);

    const prevButton = screen.getByRole('button', { name: '이전 페이지' });
    prevButton.focus();
    fireEvent.click(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(0);

    rerender(<Pagination page={0} totalPages={2} onPageChange={onPageChange} />);

    expect(screen.getByRole('button', { name: '이전 페이지' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '다음 페이지' })).toHaveFocus();
  });
});
