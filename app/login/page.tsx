import Link from 'next/link';
import { AlertCircle, Shield } from 'lucide-react';
import { getGoogleLoginUrl, getKakaoLoginUrl } from '../services/auth';
import { NoticeBox } from '../ui/NoticeBox';
import { LoginFormClient } from './LoginFormClient';

const ERROR_MESSAGES: Record<string, string> = {
  oauth_login_failed: '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.',
  session_expired: '로그인 세션을 확인할 수 없습니다. 다시 로그인해주세요.',
  // 세션이 실제로 만료된 게 아니라 서버/네트워크가 일시적으로 불안정했을 뿐인 경우
  // (proxy.ts/session-recover의 refresh 'unreachable') — "다시 로그인하세요"와 구분한다.
  session_unavailable: '일시적으로 서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.',
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? '로그인 중 문제가 발생했습니다.') : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="ansim-card w-full max-w-sm p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="mb-1 text-xl font-bold text-slate-950">안심집 로그인</h1>
          <p className="text-sm text-slate-600">사회초년생과 대학생을 위한 부동산 계약 안전 도우미</p>
        </div>

        {errorMessage && (
          <NoticeBox icon={AlertCircle} iconClassName="text-red-500" className="mb-6 bg-red-50 text-red-600">
            {errorMessage}
          </NoticeBox>
        )}

        <LoginFormClient />

        <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          또는
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={getGoogleLoginUrl()}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            구글로 로그인
          </a>
          <a
            href={getKakaoLoginUrl()}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-6 py-3 font-semibold text-[#191919] transition-colors hover:bg-[#f5dc00]"
          >
            카카오로 로그인
          </a>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className="font-bold text-teal-700 hover:text-teal-800">
            이메일로 회원가입
          </Link>
        </p>

        <Link href="/" className="mt-6 block text-center text-xs text-slate-400 hover:text-slate-600">
          랜딩 페이지로 돌아가기
        </Link>
      </div>
    </div>
  );
}
