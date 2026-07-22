import { Pencil, User } from 'lucide-react';
import Link from 'next/link';
import { profileSummaryItems } from '../../data/mypage';
import { hasRegisteredProfile } from '../../lib/profile';
import { type MyPageOverview, type UserProfile } from '../../types/domain';
import { Badge } from '../../ui/Badge';
import { InfoRow } from '../../ui/InfoRow';
import { SummaryCard } from '../../ui/SummaryCard';

type MyPageClientProps = {
  overview: MyPageOverview;
  loadError?: string;
  profile: UserProfile;
  profileLoadError?: string;
};

export function MyPageClient({ overview, loadError, profile, profileLoadError }: MyPageClientProps) {
  const isRegistered = hasRegisteredProfile(profile);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-10">
      <div className="mb-8">
        <h1 className="ansim-page-title mb-2">마이페이지</h1>
        <p className="ansim-page-description">프로필, 관심 매물, 최근 확인 이력을 한 곳에서 확인합니다.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="ansim-card p-6 lg:col-span-1">
          <div className="mb-5 flex items-start justify-between gap-4">
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
                <p className="font-bold text-slate-950">{profile.nickname || '이름 미설정'}님</p>
                <p className="text-sm text-slate-500">
                  {[profile.currentStage].filter(Boolean).join(' · ') || '프로필 정보를 등록해 주세요'}
                </p>
              </div>
            </div>
            <Link
              href="/mypage/profile"
              className="flex shrink-0 items-center gap-1 text-sm font-bold text-teal-700 hover:text-teal-800"
            >
              <Pencil className="h-4 w-4" />
              {isRegistered ? '프로필 수정' : '프로필 등록'}
            </Link>
          </div>

          {profileLoadError && <p className="mb-3 text-sm text-red-600">{profileLoadError}</p>}

          <div className="space-y-3 text-sm">
            <InfoRow
              label="관심 거래"
              value={profile.transactionType ?? '미설정'}
              className="border-b-0 py-0"
              labelClassName="text-slate-500"
              valueClassName="font-bold"
            />
            <InfoRow
              label="관심 지역"
              value={profile.interestRegion ?? '미설정'}
              className="border-b-0 py-0"
              labelClassName="text-slate-500"
              valueClassName="font-bold"
            />
            <InfoRow
              label="중점 확인"
              value="보증금 안전성"
              className="border-b-0 py-0"
              labelClassName="text-slate-500"
              valueClassName="font-bold text-teal-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2 md:grid-cols-4">
          {profileSummaryItems.map(({ icon, label, value }) => (
            <SummaryCard key={label} icon={icon} label={label} value={value} valueClassName="text-2xl" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="ansim-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">최근 이력</h2>
            <button className="text-sm font-bold text-teal-700">전체보기</button>
          </div>
          <div className="space-y-3">
            {loadError && <p className="text-sm text-red-600">{loadError}</p>}
            {overview.activityHistory.map((item) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
