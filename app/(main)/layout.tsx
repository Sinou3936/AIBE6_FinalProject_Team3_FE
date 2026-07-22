'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Home, LogOut, Menu, User, X } from 'lucide-react';
import { navItems } from '../data/navigation';
import { cn } from '../lib/cn';
import { logout } from '../services/auth';

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.push('/login');
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-40 hidden w-full border-b border-slate-200 bg-white md:block">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-950">안심집</span>
            </Link>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    isActive(item.path)
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
            </button>
            <Link
              href="/mypage"
              className="flex items-center gap-2 rounded-full border border-slate-200 p-1 pl-3 transition-colors hover:bg-slate-50"
            >
              <span className="text-sm font-medium text-slate-700">김안심님</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
                <User className="h-5 w-5 text-slate-500" />
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-full p-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-950">안심집</span>
          </Link>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-500">
              <Bell className="h-5 w-5" />
            </button>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-500">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
          <div className="flex h-full flex-col p-4">
            <div className="mb-8 flex items-center justify-between">
              <span className="text-xl font-bold text-slate-950">메뉴</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl p-4 text-lg font-medium transition-colors',
                    isActive(item.path) ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  {item.name}
                </Link>
              ))}
              <Link
                href="/mypage"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-4 flex items-center gap-3 border-t border-slate-100 p-4 pt-8 text-lg font-medium text-slate-600 hover:bg-slate-50"
              >
                <User className="h-6 w-6" />
                마이페이지
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 p-4 text-lg font-medium text-slate-600 hover:bg-slate-50"
              >
                <LogOut className="h-6 w-6" />
                로그아웃
              </button>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white px-2 md:hidden">
        {navItems.slice(0, 4).map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              'flex h-full w-full flex-col items-center justify-center gap-1 transition-colors',
              isActive(item.path) ? 'text-teal-700' : 'text-slate-400',
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        ))}
        <Link
          href="/mypage"
          className={cn(
            'flex h-full w-full flex-col items-center justify-center gap-1 transition-colors',
            isActive('/mypage') ? 'text-teal-700' : 'text-slate-400',
          )}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">마이</span>
        </Link>
      </nav>
    </div>
  );
}
