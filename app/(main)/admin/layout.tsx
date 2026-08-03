import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { type ReactNode } from 'react';
import { getCurrentUser } from '../../services/auth';
import { AdminNav } from './AdminNav';

// 관리자가 아닌 사용자에게는 이 경로가 존재한다는 사실 자체를 드러내지 않기 위해 리다이렉트가
// 아니라 404(notFound)로 처리한다. 인증 자체는 상위 (main)/layout.tsx가 이미 보장하므로,
// 여기서는 role만 추가로 확인한다.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieHeader = (await cookies()).toString();

  let role: string;
  try {
    role = (await getCurrentUser(cookieHeader)).role;
  } catch {
    notFound();
  }

  if (role !== 'ADMIN') {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <AdminNav />
      {children}
    </div>
  );
}
