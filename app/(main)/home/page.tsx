'use client';

import { AlertTriangle, ArrowRight, FileSearch, Link2, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { quickActions, quickActionToneMap } from '../../data/dashboard';
import { computeHomeSummaryCounts } from '../../lib/homeSummary';
import { getPriorityAction } from '../../lib/priorityAction';
import { getRiskCheckHref } from '../../lib/riskCheckAction';
import { classifyProfileLoadError } from '../../lib/sessionErrors';
import { getChecklistResult, getMyChecklistOverviews } from '../../services/checklist';
import { getMyContractHistory } from '../../services/contract-analysis';
import { getProperties } from '../../services/properties';
import { getMyProfile } from '../../services/user';
import {
  type ChecklistOverview,
  type ContractHistoryItem,
  type PropertySummary,
  type UserProfile,
} from '../../types/domain';
import { AccountUnavailableRedirect } from '../../ui/AccountUnavailableRedirect';
import { ChecklistProgressWidget } from '../../ui/ChecklistProgressWidget';
import { NoticeBox } from '../../ui/NoticeBox';
import { OnboardingIntroModal } from '../../ui/OnboardingIntroModal';
import { PriorityActionCard } from '../../ui/PriorityActionCard';

const emptyProfile: UserProfile = {
  nickname: '',
  email: null,
  profileImageUrl: null,
  interestRegion: null,
  transactionType: null,
  currentStage: null,
  hasPassword: false,
};

type ChecklistProgressEntry = {
  propertyId: number;
  propertyTitle: string;
  progressPercent: number;
  cautionCount: number;
};

type PageData = {
  loadError?: string;
  profileNotFound: boolean;
  profile: UserProfile;
  properties: PropertySummary[];
  propertiesTotalCount: number;
  propertiesLoadFailed: boolean;
  contractHistoryItems: ContractHistoryItem[];
  contractHistoryTotalCount: number;
  checklistOverviews: ChecklistOverview[];
  checklistProgressEntries: ChecklistProgressEntry[];
};

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notice = searchParams.get('notice') ?? undefined;
  const [data, setData] = useState<PageData | null>(null);
  // 프로필 등록(온보딩) 직후 한 번만 보여주는 사용법 안내 - 진행 상황을 계속 추적하는 위젯이
  // 아니라 그냥 이 시점에 한 번 뜨고 닫히면 끝인 정적 모달이라, 지연 초기화로 최초 렌더에서만
  // notice 값을 확인한다. 닫을 때 쿼리를 지워서 새로고침해도 다시 뜨지 않게 한다.
  const [showOnboardingIntro, setShowOnboardingIntro] = useState(() => notice === 'profile_registered');
  const closeOnboardingIntro = useCallback(() => {
    setShowOnboardingIntro(false);
    router.replace('/home');
  }, [router]);

  // setData는 이 함수 안에서 직접 호출하지 않고 항상 .then(setData)로 호출부에서 건다 - 이펙트
  // 본문에서 곧장 setState를 호출하는 모양이 되지 않도록 하기 위함(mypage/profile/page.tsx 참고).
  // "새로고침" CTA(getPriorityAction의 onRetry)가 마운트 이펙트 밖에서도 재조회를 트리거할 수
  // 있도록 useCallback으로 뽑아둔다.
  const fetchHomeData = useCallback(async (): Promise<PageData> => {
    let loadError: string | undefined;
    let profileNotFound = false;
    let propertiesLoadFailed = false;

    // 넷 다 서로 의존관계가 없는 조회라 병렬로 묶는다 - 예전엔 순차 await라 하나당 왕복 시간이
    // 그대로 누적됐는데(넷의 합만큼 대기), allSettled로 묶으면 개별 실패가 나머지에 영향을 주지
    // 않으면서도 총 대기 시간은 가장 느린 호출 하나 수준으로 줄어든다.
    const [profileResult, propertiesResult, contractHistoryResult, checklistOverviewsResult] =
      await Promise.allSettled([
        getMyProfile(),
        // 백엔드가 허용하는 최대 페이지 크기(100, PropertyController@PageableDefault 검증 로직 참고)만큼
        // 한 번에 가져온다. interestedPropertyCount/hasProperty는 아래에서 totalElements를 쓰므로
        // 매물이 100개를 넘어도 정확하지만, "중요 확인사항" 위젯(signalProperties)과 신호/체크리스트
        // 기반 카운트는 이 items 배열(최대 100개, createdAt DESC)만 보므로 101번째 이후 오래된 매물의
        // 신호는 반영되지 않는다. 실사용 규모상 무시 가능하다고 판단해 별도 페이지 순회는 하지 않는다.
        getProperties(undefined, { size: 100 }),
        // 최근 20건 안에서만 "확인 필요"(riskCount > 0) 여부를 판정한다 - 매물 신호와 동일한 이유로
        // 그보다 오래된 건은 이 알림에 반영되지 않지만, 전체 개수(totalElements)는 정확하다.
        getMyContractHistory({ size: 20 }),
        getMyChecklistOverviews(),
      ]);

    let profile = emptyProfile;
    if (profileResult.status === 'fulfilled') {
      profile = profileResult.value;
    } else if (classifyProfileLoadError(profileResult.reason) === 'not-found') {
      profileNotFound = true;
    } else {
      // 실패 시 개인화 우선순위 카드는 미등록 상태 기준으로 표시하고, 아래 배너로 실패 사실을 알린다.
      loadError = '일부 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    }

    let properties: PropertySummary[] = [];
    let propertiesTotalCount = 0;
    if (propertiesResult.status === 'fulfilled') {
      properties = propertiesResult.value.items;
      propertiesTotalCount = propertiesResult.value.totalElements;
    } else {
      // 실패 시 "매물이 없다"고 단정하지 않도록 propertiesLoadFailed로 별도 표시하고,
      // 아래 배너로도 실패 사실을 알린다.
      propertiesLoadFailed = true;
      loadError = '일부 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    }

    let contractHistoryItems: ContractHistoryItem[] = [];
    let contractHistoryTotalCount = 0;
    if (contractHistoryResult.status === 'fulfilled') {
      contractHistoryItems = contractHistoryResult.value.items;
      contractHistoryTotalCount = contractHistoryResult.value.totalElements;
    } else {
      // 실패 시 "분석한 특약사항 없음"으로 단정하지 않도록 아래 배너로 실패 사실을 알린다.
      loadError = '일부 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    }

    let checklistOverviews: ChecklistOverview[] = [];
    if (checklistOverviewsResult.status === 'fulfilled') {
      checklistOverviews = checklistOverviewsResult.value.items;
    } else {
      // 실패 시 개인화 우선순위 카드는 "불러오지 못함" 상태로 표시하고, 아래 배너로도 실패 사실을 알린다.
      loadError = '일부 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    }

    const inProgressChecklists = checklistOverviews.filter(
      (overview): overview is ChecklistOverview & { checklistId: number } =>
        overview.status === 'IN_PROGRESS' && overview.checklistId !== null,
    );
    // Promise.all은 하나만 실패해도 전체가 reject되어, 성공한 다른 매물의 위젯까지 빈 배열로
    // 밀려나 사라진다(mypage/page.tsx는 status를 먼저 채워두고 보강하는 구조라 이 문제가 없다) -
    // allSettled로 항목별 실패를 개별적으로만 빼도록 한다.
    const checklistProgressResults = await Promise.allSettled(
      inProgressChecklists.map(async (overview) => {
        const summary = await getChecklistResult(overview.checklistId);
        return {
          propertyId: overview.propertyId,
          propertyTitle: overview.propertyTitle,
          progressPercent: summary.progressPercent,
          cautionCount: summary.cautionCount,
        };
      }),
    );
    const checklistProgressEntries = checklistProgressResults
      .filter((result): result is PromiseFulfilledResult<ChecklistProgressEntry> => result.status === 'fulfilled')
      .map((result) => result.value);

    return {
      loadError,
      profileNotFound,
      profile,
      properties,
      propertiesTotalCount,
      propertiesLoadFailed,
      contractHistoryItems,
      contractHistoryTotalCount,
      checklistOverviews,
      checklistProgressEntries,
    };
  }, []);

  const retry = useCallback(() => {
    fetchHomeData().then(setData);
  }, [fetchHomeData]);

  useEffect(() => {
    fetchHomeData().then(setData);
  }, [fetchHomeData]);

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const hasProperty = data.propertiesTotalCount > 0;

  const priorityAction = getPriorityAction({
    currentStage: data.profile.currentStage,
    hasProperty,
    propertiesLoadFailed: data.propertiesLoadFailed,
    checklistOverviews: data.checklistOverviews,
    onRetry: retry,
  });

  const summaryCounts = {
    ...computeHomeSummaryCounts(data.properties, data.contractHistoryTotalCount, data.checklistOverviews),
    // items(최대 100개)가 아니라 totalElements 기준 - 매물이 100개를 넘어도 정확한 값을 보여준다.
    interestedPropertyCount: data.propertiesTotalCount,
  };
  const signalProperties = data.properties.filter((property) => (property.checkSignalCount ?? 0) > 0);
  // 분석 완료 여부가 아니라 riskCount > 0(실제로 확인이 필요한 조항이 있는지)로 판정한다 -
  // "이상 없음" 분석 결과까지 확인 필요로 잘못 뜨는 걸 막기 위함.
  const specialTermsAlerts = data.contractHistoryItems.filter((item) => item.riskCount > 0);
  // "위험 신호 확인" 퀵액션 카드만 매물/신호 상태에 따라 동적으로 목적지를 바꾼다(#181,
  // app/lib/riskCheckAction.ts 참고). 나머지 카드는 quickActions의 정적 링크를 그대로 쓴다.
  const riskCheckHref = getRiskCheckHref(hasProperty, signalProperties);
  const resolvedQuickActions = quickActions.map((action) =>
    action.title === '위험 신호 확인' ? { ...action, to: riskCheckHref } : action,
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 md:py-10">
      {data.profileNotFound && <AccountUnavailableRedirect />}

      <OnboardingIntroModal open={showOnboardingIntro} onClose={closeOnboardingIntro} />

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

      {data.loadError && (
        <div className="ansim-card mb-8 border-red-100 bg-red-50 p-4 text-sm text-red-700">{data.loadError}</div>
      )}

      <PriorityActionCard action={priorityAction} />

      <div className="mb-10 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {resolvedQuickActions.map((action) => (
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

      {data.checklistProgressEntries.length > 0 && (
        <div className="mb-10 space-y-4">
          {data.checklistProgressEntries.map((entry) => (
            <ChecklistProgressWidget
              key={entry.propertyId}
              propertyTitle={entry.propertyTitle}
              progressPercent={entry.progressPercent}
              cautionCount={entry.cautionCount}
              href={`/properties/${entry.propertyId}/checklist`}
            />
          ))}
        </div>
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
              key={item.id}
              href="/mypage"
              className="flex items-start gap-4 rounded-xl border border-red-100 bg-red-50 p-4 transition hover:bg-red-100/60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <FileSearch className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="mb-1 font-bold text-red-950">{item.summary}</p>
                <p className="text-sm leading-relaxed text-red-800">
                  전체 조항 {item.clauseCount}개 중 확인 필요 {item.riskCount}개
                </p>
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

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
