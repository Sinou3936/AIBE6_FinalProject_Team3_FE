import Link from 'next/link';
import { Bookmark, User } from 'lucide-react';
import { profileSummaryItems } from '../../data/mypage';
import { type MyPageOverview } from '../../types/domain';
import { Badge } from '../../ui/Badge';
import { InfoRow } from '../../ui/InfoRow';
import { SummaryCard } from '../../ui/SummaryCard';

type MyPageClientProps = {
  overview: MyPageOverview;
  loadError?: string;
};

export function MyPageClient({ overview, loadError }: MyPageClientProps) {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-10">
      <div className="mb-8">
        <h1 className="ansim-page-title mb-2">마이페이지</h1>
        <p className="ansim-page-description">프로필, 관심 매물, 최근 확인 이력을 한 곳에서 확인합니다.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="ansim-card p-6 lg:col-span-1">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">
              <User className="h-7 w-7 text-teal-700" />
            </div>
            <div>
              <p className="font-bold text-slate-950">김안심님</p>
              <p className="text-sm text-slate-500">사회초년생 · 서울 관악구 관심</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <InfoRow
              label="관심 거래"
              value="전세 / 반전세"
              className="border-b-0 py-0"
              labelClassName="text-slate-500"
              valueClassName="font-bold"
            />
            <InfoRow
              label="예산"
              value="보증금 2억원 이하"
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

        <div className="ansim-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">북마크한 매물</h2>
            <Link href="/properties" className="text-sm font-bold text-teal-700">
              매물 보기
            </Link>
          </div>
          <div className="space-y-3">
            {loadError && <p className="text-sm text-red-600">{loadError}</p>}
            {overview.bookmarkedProperties.map((property) => (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-teal-200"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                  <Bookmark className="h-4 w-4 text-orange-500" fill="currentColor" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{property.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{property.deposit}</p>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-slate-400">
            북마크는 매물을 다시 비교하고 현장 체크리스트로 이어가기 위한 MVP 기능입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
