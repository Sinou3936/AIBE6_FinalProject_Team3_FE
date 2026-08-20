import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ForgotPasswordFormClient } from './ForgotPasswordFormClient';

const requestPasswordReset = vi.fn();
vi.mock('../services/auth', () => ({
  requestPasswordReset: (...args: unknown[]) => requestPasswordReset(...args),
}));

describe('ForgotPasswordFormClient', () => {
  it('제출에 성공하면 폼 대신 안내 문구를 보여준다', async () => {
    requestPasswordReset.mockResolvedValueOnce(undefined);
    render(<ForgotPasswordFormClient />);

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '재설정 링크 받기' }));

    expect(await screen.findByText(/비밀번호 재설정 링크를 보내드렸어요/)).toBeInTheDocument();
    await waitFor(() => expect(requestPasswordReset).toHaveBeenCalledWith('user@example.com'));
  });

  // 회귀 테스트(2026-08-20 전수조사) - 제출에 성공하면 포커스를 갖고 있던 제출 버튼이 통째로
  // 언마운트되고 안내문으로 바뀐다. role="status"만으로는 스크린리더가 그 순간 포커스를 안내문
  // 으로 옮겨주지 않아, 계속 읽던 화면 위치와 새로 나타난 안내문이 멀리 떨어져 있으면 놓치기
  // 쉬웠다. 안내문 자체가 role="status"(암묵적 aria-live)이고, 포커스도 그리로 옮겨져야 한다.
  it('제출 성공 안내 문구는 role=status이고 포커스를 받는다', async () => {
    requestPasswordReset.mockResolvedValueOnce(undefined);
    render(<ForgotPasswordFormClient />);

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '재설정 링크 받기' }));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(/비밀번호 재설정 링크를 보내드렸어요/);
    expect(status).toHaveFocus();
  });

  it('제출에 실패하면 에러 메시지를 보여주고 폼은 그대로 남는다', async () => {
    requestPasswordReset.mockRejectedValueOnce(new Error('요청 실패'));
    render(<ForgotPasswordFormClient />);

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: '재설정 링크 받기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('요청 실패');
    expect(screen.getByRole('button', { name: '재설정 링크 받기' })).toBeInTheDocument();
  });
});
