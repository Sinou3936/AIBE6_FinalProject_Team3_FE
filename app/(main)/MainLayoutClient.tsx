'use client';

import { AlertCircle, Home, LogOut, Menu, Shield, User, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { navItems } from '../data/navigation';
import { cn } from '../lib/cn';
import { useLogout } from '../lib/useLogout';
import { NoticeBox } from '../ui/NoticeBox';
import { MainCurrentUserProvider, type MainCurrentUser } from './MainCurrentUserContext';

type MainLayoutClientProps = {
  children: ReactNode;
  nickname: string;
  profileImageUrl: string | null;
  isAdmin: boolean;
};

// app/ui/Modal.tsx의 포커스 트랩과 동일한 선택자다 - 이 모바일 메뉴는 Modal처럼 가운데 카드가
// 아니라 전체화면 슬라이드 패널이라 Modal을 그대로 재사용할 수 없어(배경 클릭으로 닫는 배경
// 오버레이 구조 자체가 다름) 최소한의 로직만 여기 별도로 둔다.
const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
  );
}

export default function MainLayoutClient({ children, nickname, profileImageUrl, isAdmin }: MainLayoutClientProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoggingOut, logoutError, handleLogout } = useLogout();

  // 헤더의 닉네임/프로필 사진은 이 컴포넌트가 소유하는 로컬 state로 관리한다 - nickname/
  // profileImageUrl prop을 그대로 렌더링하면 ProfileClient가 프로필을 저장한 직후 그 결과를
  // 반영할 방법이 없다(crossOriginAuth 배포에서는 MainLayoutGate가 마운트당 한 번만 /auth/me를
  // 확인하므로 router.refresh()가 이 prop을 갱신해주지 않는다 - MainLayoutGate.tsx 참고). 대신
  // Context로 내려주는 updateCurrentUser(setCurrentUser)를 ProfileClient가 저장 성공 직후 직접
  // 호출해 재조회 없이 즉시 반영한다.
  const [currentUser, setCurrentUser] = useState<MainCurrentUser>({ nickname, profileImageUrl });

  // same-origin 경로((main)/layout.tsx, Server Component)는 router.refresh()로 nickname/
  // profileImageUrl prop 자체를 다시 가져온다 - 그 기존 갱신 경로가 계속 동작하도록 prop이
  // 바뀌면 로컬 state도 그대로 맞춰준다(AdminUsersClient의 filters 동기화와 동일한 패턴).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentUser({ nickname, profileImageUrl });
  }, [nickname, profileImageUrl]);

  const updateCurrentUser = useCallback((patch: Partial<MainCurrentUser>) => {
    setCurrentUser((prev) => ({ ...prev, ...patch }));
  }, []);

  const isActive = (path: string) => pathname === path;

  // 모바일 햄버거 메뉴의 dialog 접근성 처리 - app/ui/Modal.tsx와 동일한 패턴(트리거 기억 후
  // 다이얼로그 안으로 포커스 이동, 닫히면 트리거로 복귀 / Escape로 닫기 + Tab 포커스 트랩)이다.
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedMobileMenuTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isMobileMenuOpen) {
      previouslyFocusedMobileMenuTriggerRef.current = document.activeElement as HTMLElement | null;
      const container = mobileMenuRef.current;
      if (container) {
        const [firstFocusable] = getFocusableElements(container);
        (firstFocusable ?? container).focus();
      }
    } else {
      previouslyFocusedMobileMenuTriggerRef.current?.focus();
      previouslyFocusedMobileMenuTriggerRef.current = null;
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const container = mobileMenuRef.current;
      if (!container) {
        return;
      }

      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-40 hidden w-full border-b border-slate-200 bg-white md:block">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/home" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-950">알고계약</span>
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
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
              >
                <Shield className="h-4 w-4" />
                관리자 페이지
              </Link>
            )}
            <Link
              href="/mypage"
              className="flex items-center gap-2 rounded-full border border-slate-200 p-1 pl-3 transition-colors hover:bg-slate-50"
            >
              <span className="text-sm font-medium text-slate-700">{currentUser.nickname}님</span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                {currentUser.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.profileImageUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-slate-500" />
                )}
              </div>
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1 rounded-full p-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
            </button>
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/home" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-950">알고계약</span>
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link href="/admin" className="p-2 text-slate-500">
                <Shield className="h-5 w-5" />
              </Link>
            )}
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-500">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {logoutError && (
        <div className="container mx-auto px-4 pt-4">
          <NoticeBox icon={AlertCircle} iconClassName="text-red-500" className="bg-red-50 text-red-600">
            {logoutError}
          </NoticeBox>
        </div>
      )}

      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          role="dialog"
          aria-modal="true"
          aria-label="메뉴"
          tabIndex={-1}
          className="fixed inset-0 z-50 bg-white md:hidden"
        >
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
                disabled={isLoggingOut}
                className="flex items-center gap-3 p-4 text-lg font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                <LogOut className="h-6 w-6" />
                {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
              </button>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 pb-20 md:pb-0">
        <MainCurrentUserProvider value={{ ...currentUser, updateCurrentUser }}>{children}</MainCurrentUserProvider>
      </main>

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
