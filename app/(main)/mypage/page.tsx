import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { classifyProfileLoadError, redirectIfSessionInvalid } from '../../lib/sessionErrors';
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

export default async function Page() {
  const cookieHeader = (await cookies()).toString();

  let nickname: string;
  try {
    nickname = (await getCurrentUser(cookieHeader)).nickname;
  } catch {
    // MainLayout과 동일한 이유로, 세션이 실제로 유효하지 않으면 재로그인 화면으로 보낸다.
    redirect('/login?error=session_expired');
  }

  // 최근 활동 내역(activityHistory, 특약사항 분석 포함)은 백엔드에 아직 이 엔드포인트가 없어
  // 항상 실패한다(app/services/activityHistory.ts 참고) - ENABLE_ANALYSIS_HISTORY가 꺼져 있어
  // 화면에 드러나지 않으므로 지금은 그대로 둔다.
  let activityHistory: ActivityHistoryItem[] = [];
  let activityHistoryLoadError: string | undefined;
  try {
    activityHistory = await getActivityHistory(cookieHeader);
  } catch (error) {
    redirectIfSessionInvalid(error);
    activityHistoryLoadError = '마이페이지 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }

  let properties: PropertySummary[] = [];
  let propertiesTotalCount = 0;
  let propertiesLoadError: string | undefined;
  try {
    // 홈 화면과 동일한 이유(app/(main)/home/page.tsx 참고)로 최대 페이지 크기(100)만큼 가져온다.
    const propertiesPage = await getProperties(cookieHeader, { size: 100 });
    properties = propertiesPage.items;
    propertiesTotalCount = propertiesPage.totalElements;
  } catch (error) {
    redirectIfSessionInvalid(error);
    propertiesLoadError = '매물 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }

  const checklistProgressByPropertyId: Record<number, ChecklistProgress> = {};
  try {
    const checklistOverviews = await getMyChecklistOverviews(cookieHeader);
    checklistOverviews.forEach((overview) => {
      checklistProgressByPropertyId[overview.propertyId] = { status: overview.status };
    });

    const withResult = checklistOverviews.filter(
      (overview): overview is ChecklistOverview & { checklistId: number } =>
        overview.status !== 'NOT_STARTED' && overview.checklistId !== null,
    );
    try {
      const summaries = await Promise.all(
        withResult.map((overview) => getChecklistResult(overview.checklistId, cookieHeader)),
      );
      withResult.forEach((overview, index) => {
        checklistProgressByPropertyId[overview.propertyId] = {
          status: overview.status,
          progressPercent: summaries[index].progressPercent,
          cautionCount: summaries[index].cautionCount,
        };
      });
    } catch (error) {
      redirectIfSessionInvalid(error);
    }
  } catch (error) {
    redirectIfSessionInvalid(error);
  }

  let profile = emptyProfile;
  let profileLoadError: string | undefined;
  let profileNotFound = false;

  try {
    const cookieHeader = (await headers()).get('cookie') ?? undefined;
    profile = await getMyProfile(cookieHeader);
  } catch (error) {
    if (classifyProfileLoadError(error) === 'not-found') {
      profileNotFound = true;
    } else {
      profileLoadError = '프로필 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    }
  }

  return (
    <>
      {profileNotFound && <AccountUnavailableRedirect />}
      <MyPageClient
        activityHistory={activityHistory}
        activityHistoryLoadError={activityHistoryLoadError}
        properties={properties}
        propertiesTotalCount={propertiesTotalCount}
        propertiesLoadError={propertiesLoadError}
        checklistProgressByPropertyId={checklistProgressByPropertyId}
        nickname={nickname}
        profile={profile}
        profileLoadError={profileLoadError}
      />
    </>
  );
}
