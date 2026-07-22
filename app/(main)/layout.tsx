import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { type ReactNode } from 'react';
import { getCurrentUser } from '../services/auth';
import MainLayoutClient from './MainLayoutClient';

export default async function MainLayout({ children }: { children: ReactNode }) {
  const cookieHeader = (await cookies()).toString();

  let nickname: string;
  try {
    nickname = (await getCurrentUser(cookieHeader)).nickname;
  } catch {
    // 프록시는 access_token 쿠키 존재 여부만 확인하고 만료/위조까지는 걸러내지 않으므로,
    // 실제 유효성은 여기서 /auth/me 호출 결과로 판단해 재로그인 화면으로 보낸다.
    redirect('/login?error=session_expired');
  }

  return <MainLayoutClient nickname={nickname}>{children}</MainLayoutClient>;
}
