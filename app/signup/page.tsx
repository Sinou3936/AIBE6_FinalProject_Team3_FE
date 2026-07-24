import Link from 'next/link';
import { Shield } from 'lucide-react';
import { SignupFormClient } from './SignupFormClient';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="ansim-card w-full max-w-sm p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="mb-1 text-xl font-bold text-slate-950">안심집 회원가입</h1>
          <p className="text-sm text-slate-600">이메일로 가입하고 바로 시작해 보세요</p>
        </div>

        <SignupFormClient />

        <p className="mt-6 text-center text-sm text-slate-600">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-bold text-teal-700 hover:text-teal-800">
            로그인
          </Link>
        </p>

        <Link href="/" className="mt-6 block text-center text-xs text-slate-400 hover:text-slate-600">
          랜딩 페이지로 돌아가기
        </Link>
      </div>
    </div>
  );
}
