'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { classifyProfileLoadError } from '../../lib/sessionErrors';
import { getActivityHistory } from '../../services/activityHistory';
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
import { useMainCurrentUser } from '../MainCurrentUserContext';
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
  // 상단 인사말에 쓰는 닉네임은 MainLayoutClient(부모 레이아웃)가 로그인 판단 과정에서 이미
  // 확인해둔 값을 그대로 재사용한다 - 이 페이지가 직접 getCurrentUser()를 또 호출하면 /mypage에
  // 진입할 때마다 /auth/me가 불필요하게 두 번 왕복한다(admin/AdminCurrentUserContext.tsx와
  // 동일한 이유).
  const { nickname } = useMainCurrentUser();
  const [data, setData] = useState<PageData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 인증 판단/리다이렉트는 MainLayoutGate.tsx 한 곳에서만 한다 - 이 페이지가 렌더링됐다는
      // 것 자체가 이미 세션이 유효하다는 뜻이므로, 아래 개별 데이터 조회가 실패해도(세션 무효
      // 포함) 여기서 다시 재로그인으로 판단하지 않고 각자 자리에 빈 값/에러 문구만 남긴다.

      // 아래 네 조회는 서로 의존 관계가 없으므로, await 없이 먼저 전부 호출해 네트워크 요청을
      // 동시에 내보낸 뒤 순서대로 await한다 - 각 조회가 실패를 자신의 try/catch에서 잡아 빈
      // 값/에러 문구로만 남기고 다시 throw하지 않으므로, 이렇게 순서대로 await해도 한 조회의
      // 실패가 나머지 조회나 화면 렌더링을 막지 않는다(기존 동작 그대로 유지).
      const activityHistoryPromise = getActivityHistory();
      // 홈 화면과 동일한 이유(app/(main)/home/page.tsx 참고)로 최대 페이지 크기(100)만큼 가져온다.
      const propertiesPromise = getProperties(undefined, { size: 100 });
      const checklistOverviewsPromise = getMyChecklistOverviews();
      const profilePromise = getMyProfile();

      // 최근 활동 내역(activityHistory, 특약사항 분석 포함)은 백엔드에 아직 이 엔드포인트가 없어
      // 항상 실패한다(app/services/activityHistory.ts 참고) - ENABLE_ANALYSIS_HISTORY가 꺼져 있어
      // 화면에 드러나지 않으므로 지금은 그대로 둔다.
      let activityHistory: ActivityHistoryItem[] = [];
      let activityHistoryLoadError: string | undefined;
      try {
        activityHistory = await activityHistoryPromise;
      } catch {
        activityHistoryLoadError = '마이페이지 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
      }

      let properties: PropertySummary[] = [];
      let propertiesTotalCount = 0;
      let propertiesLoadError: string | undefined;
      try {
        const propertiesPage = await propertiesPromise;
        properties = propertiesPage.items;
        propertiesTotalCount = propertiesPage.totalElements;
      } catch {
        propertiesLoadError = '매물 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
      }

      const checklistProgressByPropertyId: Record<number, ChecklistProgress> = {};
      try {
        const checklistOverviews = (await checklistOverviewsPromise).items;
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
      } catch {
        // 체크리스트 개요 조회 실패는 진행 상황 위젯을 빈 채로 둔다.
      }

      let profile = emptyProfile;
      let profileLoadError: string | undefined;
      let profileNotFound = false;
      try {
        profile = await profilePromise;
      } catch (error) {
        if (classifyProfileLoadError(error) === 'not-found') {
          profileNotFound = true;
        } else {
          profileLoadError = '프로필 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
        }
      }

      if (!cancelled) {
        setData({
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
        nickname={nickname}
        profile={data.profile}
        profileLoadError={data.profileLoadError}
      />
    </>
  );
}
