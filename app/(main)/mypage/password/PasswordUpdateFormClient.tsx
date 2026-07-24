'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError } from '../../../lib/api/http';
import { updatePassword } from '../../../services/auth';

export function PasswordUpdateFormClient() {
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
      // 이 페이지에 머무는 동안 Access Token이 만료되면 서버는 COMMON_401(인증 필요)을 준다 —
      // 클라이언트 컴포넌트는 httpOnly인 refresh_token을 읽을 수 없어 http.ts의 자동 재시도
      // 대상이 아니므로(주석 참고), 폼 에러로 보여주는 대신 재로그인 화면으로 보내야 한다.
      // AUTH_INVALID_CREDENTIALS(현재 비밀번호 오류)는 이 케이스와 구분해 폼 에러로 유지한다.
      if (submitError instanceof ApiError && submitError.body?.code === 'COMMON_401') {
        router.push('/login?error=session_expired');
        return;
      }

      setError(
        submitError instanceof ApiError
          ? submitError.message
          : '비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">현재 비밀번호</span>
        <input
          className="ansim-input w-full"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          placeholder="설정한 적이 없다면 비워두세요"
          autoComplete="current-password"
        />
      </label>
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
          pattern="(?=.*[A-Za-z])(?=.*\d)[\x21-\x7E]{8,72}"
          title="영문과 숫자를 포함한 8~72자의 영문/숫자/기호를 입력해 주세요. 공백은 사용할 수 없습니다."
          required
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm font-bold text-teal-700">비밀번호가 변경되었습니다.</p>}

      <button type="submit" disabled={isSaving} className="ansim-button-primary w-full py-3 disabled:opacity-60">
        {isSaving ? '변경 중...' : '비밀번호 변경'}
      </button>
    </form>
  );
}
