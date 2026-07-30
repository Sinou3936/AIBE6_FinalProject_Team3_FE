import { AlertTriangle, ArrowRight, FileSearch, Link2 } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { quickActions, quickActionToneMap } from '../../data/dashboard';
import { computeHomeSummaryCounts } from '../../lib/homeSummary';
import { getPriorityAction } from '../../lib/priorityAction';
import { getMyPageOverview } from '../../services/mypage';
import { getProperties } from '../../services/properties';
import { getMyProfile } from '../../services/user';
import { type MyPageOverview, type PropertySummary, type UserProfile } from '../../types/domain';
import { ChecklistProgressWidget } from '../../ui/ChecklistProgressWidget';
import { NoticeBox } from '../../ui/NoticeBox';
import { PriorityActionCard } from '../../ui/PriorityActionCard';

export const dynamic = 'force-dynamic';

const emptyProfile: UserProfile = {
  nickname: '',
  email: null,
  profileImageUrl: null,
  interestRegion: null,
  transactionType: null,
  currentStage: null,
  hasPassword: false,
};

const emptyOverview: MyPageOverview = {
  activityHistory: [],
  bookmarkedProperties: [],
};

type HomePageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function Page({ searchParams }: HomePageProps) {
  const { notice } = await searchParams;
  const cookieHeader = (await cookies()).toString();

  let loadError: string | undefined;

  let profile = emptyProfile;
  try {
    profile = await getMyProfile(cookieHeader);
  } catch {
    // 실패 시 개인화 우선순위 카드는 미등록 상태 기준으로 표시하고, 아래 배너로 실패 사실을 알린다.
    loadError = '일부 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }

  let properties: PropertySummary[] = [];
  try {
    properties = (await getProperties()).items;
  } catch {
    // 실패 시 요약/알림/매물 기준 정보는 빈 상태로 표시하고, 아래 배너로 실패 사실을 알린다.
    loadError = '일부 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }

  let overview = emptyOverview;
  try {
    overview = await getMyPageOverview(cookieHeader);
  } catch {
    // 실패 시 분석한 특약사항 카운트는 0으로 표시하고, 아래 배너로 실패 사실을 알린다.
    loadError = '일부 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }

  // TODO: 백엔드에 hasProperty/hasChecklist 전용 필드(또는 API)가 추가되면 이 파생 계산을 실제 값으로 교체하세요.
  // 지금은 매물 목록/매물별 체크리스트 진행률(checklist)로 근사합니다.
  const hasProperty = properties.length > 0;
  const hasChecklist = properties.some((property) => (property.checklist ?? 0) > 0);
  const primaryProperty = properties[0];

  const priorityAction = getPriorityAction({
    currentStage: profile.currentStage,
    hasProperty,
    hasChecklist,
    propertyTitle: primaryProperty?.title,
  });

  const summaryCounts = computeHomeSummaryCounts(properties, overview.activityHistory);
  const signalProperties = properties.filter((property) => (property.checkSignalCount ?? 0) > 0);
  const specialTermsAlerts = overview.activityHistory.filter((item) => item.type === '특약사항 분석');

  // TODO: 체크리스트 항목별 확인/주의 개수는 체크리스트 저장 API가 추가되면 실제 값으로 교체하세요.
  // 아직 항목별 진행 상태가 저장되지 않아 레이아웃 확인용 임시 값을 사용합니다.
  const mockChecklistTotal = 20;
  const mockChecklistChecked = 12;
  const mockChecklistCaution = 3;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 md:py-10">
      <div className="mb-8">
        <h1 className="ansim-page-title mb-2">계약 전 확인할 항목을 정리했어요</h1>
        <p className="ansim-page-description">
          매물 가격, 보증금 안전성, 현장 확인, 특약사항 분석을 순서대로 점검하세요.
        </p>
      </div>

      {notice === 'account_linked' && (
        <div className="ansim-card mb-8 flex items-start gap-2 border-teal-100 bg-teal-50 p-4 text-sm text-teal-800">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
          <span>이미 가입되어 있던 계정과 자동으로 연결되었어요.</span>
        </div>
      )}

      {loadError && (
        <div className="ansim-card mb-8 border-red-100 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
      )}

      <PriorityActionCard action={priorityAction} />

      <div className="mb-10 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.to}
            className="ansim-card group p-4 transition-all hover:border-teal-200 hover:bg-teal-50/30 md:p-6"
          >
            <div
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${quickActionToneMap[action.tone]}`}
            >
              <action.icon className="h-6 w-6" />
            </div>
            <h3 className="mb-1 font-bold text-slate-950">{action.title}</h3>
            <p className="text-xs leading-relaxed text-slate-600 md:text-sm">{action.description}</p>
          </Link>
        ))}
      </div>

      <div className="ansim-card mb-10 bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">요약 정보</h2>
          <Link href="/mypage" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-950">
            전체보기 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ['관심 매물', `${summaryCounts.interestedPropertyCount}개`],
            ['확인 필요 신호', `${summaryCounts.signalsToCheckCount}개`],
            ['진행 중 체크리스트', `${summaryCounts.activeChecklistCount}개`],
            ['분석한 특약사항', `${summaryCounts.analyzedSpecialTermsCount}건`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="mb-1 text-sm text-slate-500">{label}</p>
              <p className="text-2xl font-bold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {hasChecklist && (
        <ChecklistProgressWidget
          checkedCount={mockChecklistChecked}
          totalCount={mockChecklistTotal}
          cautionCount={mockChecklistCaution}
        />
      )}

      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-950">중요 확인사항</h2>
          {signalProperties.length === 0 && specialTermsAlerts.length === 0 && (
            <div className="ansim-card p-4 text-sm text-slate-500">확인이 필요한 사항이 없습니다.</div>
          )}
          {signalProperties.map((property) => (
            <Link
              key={property.id}
              href={`/properties/${property.id}`}
              className="flex items-start gap-4 rounded-xl border border-orange-100 bg-orange-50 p-4 transition hover:bg-orange-100/60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="mb-1 font-bold text-orange-950">
                  {property.title} 확인 필요 신호 {property.checkSignalCount}개
                </p>
                <p className="text-sm leading-relaxed text-orange-800">{property.signalSummary}</p>
              </div>
            </Link>
          ))}
          {specialTermsAlerts.map((item) => (
            <Link
              key={`${item.title}-${item.type}`}
              href="/mypage"
              className="flex items-start gap-4 rounded-xl border border-red-100 bg-red-50 p-4 transition hover:bg-red-100/60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <FileSearch className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="mb-1 font-bold text-red-950">{item.title} 특약사항 확인 필요</p>
                <p className="text-sm leading-relaxed text-red-800">{item.status}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <NoticeBox icon={AlertTriangle} iconClassName="text-orange-500">
        <span className="font-bold">안내:</span> 위험 신호는 확정 판단이 아니라 공공데이터와 입력 정보를 바탕으로 한
        참고용 설명입니다. 실제 계약 전에는 등기부등본, 보증보험 가능 여부, 전문가 검토를 함께 확인하세요.
      </NoticeBox>
    </div>
  );
}
