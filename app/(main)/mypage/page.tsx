'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { classifyProfileLoadError } from '../../lib/sessionErrors';
import { getActivityHistory } from '../../services/activityHistory';
import { getCurrentUser } from '../../services/auth';
import { getChecklistResult, getMyChecklistOverviews } from '../../services/checklist';
import { getProperties } from '../../services/properties';
import { getMyProfile } from '../../services/user';
import {
  type ActivityHistoryItem,
  type ChecklistOverview,
  type ChecklistProgress,
  type PropertySummary,
  type UserProfile,
} from '../../types/domain';
import { AccountUnavailableRedirect } from '../../ui/AccountUnavailableRedirect';
import { MyPageClient } from './MyPageClient';

const emptyProfile: UserProfile = {
  nickname: '',
  email: null,
  profileImageUrl: null,
  interestRegion: null,
  transactionType: null,
  currentStage: null,
  hasPassword: false,
};

type PageData = {
  nickname: string;
  activityHistory: ActivityHistoryItem[];
  activityHistoryLoadError?: string;
  properties: PropertySummary[];
  propertiesTotalCount: number;
  propertiesLoadError?: string;
  checklistProgressByPropertyId: Record<number, ChecklistProgress>;
  profile: UserProfile;
  profileLoadError?: string;
  profileNotFound: boolean;
};

export default function Page() {
  const [data, setData] = useState<PageData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 인증 판단/리다이렉트는 MainLayoutGate.tsx 한 곳에서만 한다 - 이 페이지가 렌더링됐다는
      // 것 자체가 이미 세션이 유효하다는 뜻이므로, 아래 개별 데이터 조회가 실패해도(세션 무효
      // 포함) 여기서 다시 재로그인으로 판단하지 않고 각자 자리에 빈 값/에러 문구만 남긴다.
      //
      // 다섯 조회 다 서로 의존관계가 없어 병렬로 묶는다 - 예전엔 순차 await라 하나당 왕복 시간이
      // 그대로 누적됐는데(다섯의 합만큼 대기, 홈 화면과 함께 이 앱에서 가장 느리게 뜨는 화면이었다),
      // allSettled로 묶으면 개별 실패가 나머지에 영향을 주지 않으면서도 총 대기 시간은 가장 느린
      // 호출 하나 수준으로 줄어든다.
      const [currentUserResult, activityHistoryResult, propertiesResult, checklistOverviewsResult, profileResult] =
        await Promise.allSettled([
          getCurrentUser(),
          getActivityHistory(),
          // 홈 화면과 동일한 이유(app/(main)/home/page.tsx 참고)로 최대 페이지 크기(100)만큼 가져온다.
          getProperties(undefined, { size: 100 }),
          getMyChecklistOverviews(),
          getMyProfile(),
        ]);

      const nickname = currentUserResult.status === 'fulfilled' ? currentUserResult.value.nickname : '';
      // 닉네임은 화면 상단 인사말에만 쓰이므로 실패해도 빈 채로 넘어간다.

      // 최근 활동 내역(activityHistory, 특약사항 분석 포함)은 백엔드에 아직 이 엔드포인트가 없어,
      // ENABLE_ANALYSIS_HISTORY가 꺼져 있는 동안은 getActivityHistory()가 호출조차 하지 않고 빈
      // 배열을 바로 반환한다(app/services/activityHistory.ts 참고) - 그래서 지금은 아래 else(진짜
      // 조회 실패) 분기를 탈 일이 없다. 화면 쪽도 같은 플래그로 "최근 이력" 섹션 자체를 숨기므로
      // (MyPageClient.tsx 참고) 이 값이 안 쓰이는 상태다. 플래그를 켜면 실제 실패 시에도 정상적으로
      // 이 분기가 동작한다.
      let activityHistory: ActivityHistoryItem[] = [];
      let activityHistoryLoadError: string | undefined;
      if (activityHistoryResult.status === 'fulfilled') {
        activityHistory = activityHistoryResult.value;
      } else {
        activityHistoryLoadError = '마이페이지 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
      }

      let properties: PropertySummary[] = [];
      let propertiesTotalCount = 0;
      let propertiesLoadError: string | undefined;
      if (propertiesResult.status === 'fulfilled') {
        properties = propertiesResult.value.items;
        propertiesTotalCount = propertiesResult.value.totalElements;
      } else {
        propertiesLoadError = '매물 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
      }

      const checklistProgressByPropertyId: Record<number, ChecklistProgress> = {};
      if (checklistOverviewsResult.status === 'fulfilled') {
        const checklistOverviews = checklistOverviewsResult.value.items;
        checklistOverviews.forEach((overview) => {
          checklistProgressByPropertyId[overview.propertyId] = { status: overview.status };
        });

        const withResult = checklistOverviews.filter(
          (overview): overview is ChecklistOverview & { checklistId: number } =>
            overview.status !== 'NOT_STARTED' && overview.checklistId !== null,
        );
        try {
          const summaries = await Promise.all(withResult.map((overview) => getChecklistResult(overview.checklistId)));
          withResult.forEach((overview, index) => {
            checklistProgressByPropertyId[overview.propertyId] = {
              status: overview.status,
              progressPercent: summaries[index].progressPercent,
              cautionCount: summaries[index].cautionCount,
            };
          });
        } catch {
          // 진행률/주의 개수 보강 실패는 상태(status)만 있는 채로 둔다.
        }
      }
      // 체크리스트 개요 조회 실패는 진행 상황 위젯을 빈 채로 둔다.

      let profile = emptyProfile;
      let profileLoadError: string | undefined;
      let profileNotFound = false;
      if (profileResult.status === 'fulfilled') {
        profile = profileResult.value;
      } else if (classifyProfileLoadError(profileResult.reason) === 'not-found') {
        profileNotFound = true;
      } else {
        profileLoadError = '프로필 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
      }

      if (!cancelled) {
        setData({
          nickname,
          activityHistory,
          activityHistoryLoadError,
          properties,
          propertiesTotalCount,
          propertiesLoadError,
          checklistProgressByPropertyId,
          profile,
          profileLoadError,
          profileNotFound,
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <>
      {data.profileNotFound && <AccountUnavailableRedirect />}
      <MyPageClient
        activityHistory={data.activityHistory}
        activityHistoryLoadError={data.activityHistoryLoadError}
        properties={data.properties}
        propertiesTotalCount={data.propertiesTotalCount}
        propertiesLoadError={data.propertiesLoadError}
        checklistProgressByPropertyId={data.checklistProgressByPropertyId}
        nickname={data.nickname}
        profile={data.profile}
        profileLoadError={data.profileLoadError}
      />
    </>
  );
}
