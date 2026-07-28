import { ArrowLeft } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { getPasswordPolicy } from '../../../services/auth';
import { getMyProfile } from '../../../services/user';
import { type PasswordPolicyDto } from '../../../types/api';
import { PasswordUpdateFormClient } from './PasswordUpdateFormClient';

export const dynamic = 'force-dynamic';

// backend가 내려오지 않는 극히 드문 경우에만 쓰는 최후의 fallback이다 — 평소엔 항상
// getPasswordPolicy()가 실제 정책을 받아오므로, 이 값이 실제 정책과 어긋나도 서버가 최종
// 검증에서 걸러주니 이중 실패로 이어지지 않는다.
const FALLBACK_PASSWORD_POLICY: PasswordPolicyDto = {
  pattern: '(?=.*[A-Za-z])(?=.*\\d)[\\x21-\\x7E]{8,72}',
  message: '영문과 숫자를 포함한 8~72자의 영문/숫자/기호를 입력해 주세요. 공백은 사용할 수 없습니다.',
};

export default async function PasswordUpdatePage() {
  const cookieHeader = (await headers()).get('cookie') ?? undefined;

  let hasPassword = false;
  try {
    hasPassword = (await getMyProfile(cookieHeader)).hasPassword;
  } catch {
    // 프로필 조회에 실패하면 안전하게 "최초 설정" 폼(현재 비밀번호 입력란 없음)으로 보여준다.
  }

  let passwordPolicy = FALLBACK_PASSWORD_POLICY;
  try {
    passwordPolicy = await getPasswordPolicy();
  } catch {
    // 조회 실패해도 폴백 정책으로 폼은 계속 동작해야 한다.
  }

  const title = hasPassword ? '비밀번호 변경' : '비밀번호 설정';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <Link href="/mypage" className="-ml-2 p-2 text-slate-500 hover:text-slate-950">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-bold text-slate-950">{title}</h1>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="ansim-card p-6">
          <h2 className="mb-2 text-xl font-bold text-slate-950">
            {hasPassword ? '새 비밀번호로 변경해 주세요' : '비밀번호를 설정해 주세요'}
          </h2>
          <p className="mb-6 text-sm text-slate-600">
            {hasPassword
              ? '현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.'
              : '구글/카카오로 가입하셨다면 비밀번호를 설정해 같은 이메일로 로그인할 수도 있어요.'}
          </p>
          <PasswordUpdateFormClient hasPassword={hasPassword} passwordPolicy={passwordPolicy} />
        </div>
      </div>
    </div>
  );
}
