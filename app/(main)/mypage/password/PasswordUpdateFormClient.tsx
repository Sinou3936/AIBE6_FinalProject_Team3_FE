'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError, isSessionInvalidErrorCode } from '../../../lib/api/http';
import { updatePassword } from '../../../services/auth';
import { type PasswordPolicyDto } from '../../../types/api';
import { Modal } from '../../../ui/Modal';

type PasswordUpdateFormClientProps = {
  hasPassword: boolean;
  passwordPolicy: PasswordPolicyDto;
};

export function PasswordUpdateFormClient({ hasPassword, passwordPolicy }: PasswordUpdateFormClientProps) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSaving(true);
    setError(undefined);
    setSuccess(false);

    try {
      await updatePassword({ currentPassword: currentPassword || undefined, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (submitError) {
      // 이 페이지에 머무는 동안 Access Token이 없어지거나/무효화되거나/만료되면 서버는 401
      // (UNAUTHORIZED 또는 AUTH_TOKEN_MISSING/INVALID/EXPIRED)을 준다 — requestJson()에는 아직
      // 브라우저-side refresh-then-retry 흐름이 없어(httpOnly라서 불가능한 게 아니라 단순히
      // 구현이 안 된 것 — docs/specs/auth-design.md 참고) 이 401을 그대로 던지므로,
      // 폼 에러로 보여주는 대신 재로그인 화면으로 보내야 한다. 화면 문구는 사유별로 안 나누지만
      // (docs/specs/auth-design.md 참고) "재로그인이 필요한가" 판단은 네 코드를 전부 인식해야 한다.
      // AUTH_INVALID_CREDENTIALS(현재 비밀번호 오류)는 이 케이스와 구분해 폼 에러로 유지한다.
      if (submitError instanceof ApiError && isSessionInvalidErrorCode(submitError.body?.code)) {
        router.push('/login?error=session_expired');
        return;
      }

      setError(
        submitError instanceof ApiError
          ? submitError.message
          : `비밀번호 ${hasPassword ? '변경' : '설정'}에 실패했습니다. 잠시 후 다시 시도해 주세요.`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = () => {
    router.push('/mypage');
    router.refresh();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {hasPassword && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">현재 비밀번호</span>
            <input
              className="ansim-input w-full"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">새 비밀번호</span>
          <input
            className="ansim-input w-full"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="영문, 숫자 포함 8~72자"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            pattern={passwordPolicy.pattern}
            title={passwordPolicy.message}
            required
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={isSaving} className="ansim-button-primary w-full py-3 disabled:opacity-60">
          {isSaving ? `${hasPassword ? '변경' : '설정'} 중...` : `비밀번호 ${hasPassword ? '변경' : '설정'}`}
        </button>
      </form>

      <Modal open={success} onClose={() => setSuccess(false)}>
        <p className="mb-4 text-sm font-bold text-teal-700">
          비밀번호가 {hasPassword ? '변경' : '설정'}되었습니다.
        </p>
        <button type="button" onClick={handleConfirm} className="ansim-button-primary w-full py-3">
          확인
        </button>
      </Modal>
    </>
  );
}
