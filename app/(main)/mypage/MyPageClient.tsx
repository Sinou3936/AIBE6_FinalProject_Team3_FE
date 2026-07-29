'use client';

import { Lock, LogOut, Pencil, Plus, User, UserX } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ENABLE_ANALYSIS_HISTORY } from '../../config/features';
import { hasRegisteredProfile } from '../../lib/profile';
import { logout } from '../../services/auth';
import { type MyPageOverview, type UserProfile } from '../../types/domain';
import { Badge } from '../../ui/Badge';
import { InfoRow } from '../../ui/InfoRow';
import { PropertyListItem } from '../../ui/PropertyListItem';

type MyPageClientProps = {
  overview: MyPageOverview;
  loadError?: string;
  nickname: string;
  profile: UserProfile;
  profileLoadError?: string;
};

export function MyPageClient({ overview, loadError, nickname, profile, profileLoadError }: MyPageClientProps) {
  const router = useRouter();
  const isRegistered = hasRegisteredProfile(profile);
  const properties = overview.bookmarkedProperties;
  const signalCount = properties.reduce((sum, property) => sum + (property.checkSignalCount ?? 0), 0);
  const [logoutError, setLogoutError] = useState<string>();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 서버 호출이 실패하면(네트워크 오류, 백엔드 일시 장애 등) 로그아웃은 실제로 안 됐을 수 있다 —
  // 무조건 /login으로 보내면 사용자는 로그아웃된 줄 알지만 서버 세션은 그대로 남는다. 성공했을
  // 때만 이동하고, 실패하면 화면에 남겨 재시도하게 한다. isLoggingOut으로 버튼을 비활성화해,
  // 응답 오는 동안 여러 번 눌러 /auth/logout이 중복 호출되는 것도 막는다.
  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    setLogoutError(undefined);
    try {
      await logout();
      router.push('/login');
    } catch {
      setLogoutError('로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setIsLoggingOut(false);
    }
  }

  function handleWithdrawClick() {
    // TODO: 회원 탈퇴 확인 모달 연동 (백엔드 탈퇴 API 확정 후 진행)
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-10">
      <div className="mb-8">
        <h1 className="ansim-page-title mb-2">마이페이지</h1>
        <p className="ansim-page-description">프로필, 관심 매물, 최근 확인 이력을 한 곳에서 확인합니다.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-[1.3fr_1fr]">
        <div className="ansim-card p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-100">
                {profile.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.profileImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-7 w-7 text-teal-700" />
                )}
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <p className="font-bold text-slate-950">{profile.nickname || nickname}</p>
                  {profile.currentStage && <Badge className="bg-teal-50 text-teal-700">{profile.currentStage}</Badge>}
                </div>
                {!profile.currentStage && <p className="text-sm text-slate-500">프로필 정보를 등록해 주세요</p>}
              </div>
            </div>
            <Link
              href="/mypage/profile"
              className="flex shrink-0 items-center gap-1 text-sm font-bold text-teal-700 hover:text-teal-800"
            >
              <Pencil className="h-4 w-4" />
              {isRegistered ? '수정' : '등록'}
            </Link>
          </div>

          {profileLoadError && <p className="mb-3 text-sm text-red-600">{profileLoadError}</p>}

          <div className="space-y-1 border-t border-slate-100 pt-4 text-sm">
            <InfoRow
              label="관심 거래"
              value={profile.transactionType ?? '미설정'}
              className="border-b-0 py-1"
              labelClassName="text-slate-500"
              valueClassName="font-bold"
            />
            <InfoRow
              label="관심 지역"
              value={profile.interestRegion ?? '미설정'}
              className="border-b-0 py-1"
              labelClassName="text-slate-500"
              valueClassName="font-bold"
            />
          </div>
        </div>

        <div className="ansim-card p-6">
          <p className="mb-3 text-sm font-bold text-slate-950">계정 관리</p>
          <div className="space-y-1">
            <Link
              href="/mypage/password"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Lock className="h-4 w-4 text-slate-400" />
              {profile.hasPassword ? '비밀번호 변경' : '비밀번호 설정'}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4 text-slate-400" />
              {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
            </button>
            {logoutError && <p className="px-3 text-xs text-red-600">{logoutError}</p>}
            <button
              type="button"
              onClick={handleWithdrawClick}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <UserX className="h-4 w-4 text-red-500" />
              회원 탈퇴
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">등록 매물</h2>
          <Link
            href="/properties/register"
            className="flex items-center gap-1 text-sm font-bold text-teal-700 hover:text-teal-800"
          >
            <Plus className="h-4 w-4" /> 매물 등록
          </Link>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          등록 매물 {properties.length}개 · 확인 필요 신호 {signalCount}개
        </p>

        {loadError && (
          <div className="ansim-card mb-4 border-red-100 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
        )}

        {!loadError && properties.length === 0 && (
          <div className="ansim-card p-6 text-center text-sm text-slate-500">
            <p className="mb-4">아직 등록한 매물이 없어요</p>
            <Link href="/properties/register" className="ansim-button-primary inline-flex w-fit px-5 py-3">
              <Plus className="h-4 w-4" /> 매물 등록하기
            </Link>
          </div>
        )}

        {properties.length > 0 && (
          <div className="space-y-4">
            {properties.map((property) => (
              <PropertyListItem key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>

      {ENABLE_ANALYSIS_HISTORY && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="ansim-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-950">최근 이력</h2>
              <button className="text-sm font-bold text-teal-700">전체보기</button>
            </div>
            <div className="space-y-3">
              {loadError ? (
                <p className="text-sm text-slate-500">이 기능은 준비 중입니다.</p>
              ) : (
                overview.activityHistory.map((item) => (
                  <div key={`${item.title}-${item.type}`} className="rounded-xl border border-slate-100 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="font-bold text-slate-950">{item.title}</p>
                      <Badge className="shrink-0 bg-slate-100 text-slate-600">{item.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{item.date}</span>
                      <span className="font-bold text-orange-600">{item.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
