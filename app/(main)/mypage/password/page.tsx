import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PasswordUpdateFormClient } from './PasswordUpdateFormClient';

export default function PasswordUpdatePage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <Link href="/mypage" className="-ml-2 p-2 text-slate-500 hover:text-slate-950">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-bold text-slate-950">비밀번호 변경</h1>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="ansim-card p-6">
          <h2 className="mb-2 text-xl font-bold text-slate-950">비밀번호를 설정해 주세요</h2>
          <p className="mb-6 text-sm text-slate-600">
            구글/카카오로 가입하셨다면 비밀번호를 설정해 같은 이메일로 로그인할 수도 있어요.
          </p>
          <PasswordUpdateFormClient />
        </div>
      </div>
    </div>
  );
}
