import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../services/auth';
import { getMyPageOverview } from '../../services/mypage';
import { getMyProfile } from '../../services/user';
import { type MyPageOverview, type UserProfile } from '../../types/domain';
import { MyPageClient } from './MyPageClient';

export const dynamic = 'force-dynamic';

const emptyOverview: MyPageOverview = {
  activityHistory: [],
  bookmarkedProperties: [],
};

const emptyProfile: UserProfile = {
  nickname: '',
  profileImageUrl: null,
  interestRegion: null,
  transactionType: null,
  currentStage: null,
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

  let overview = emptyOverview;
  let loadError: string | undefined;
  let profile = emptyProfile;
  let profileLoadError: string | undefined;

  try {
    overview = await getMyPageOverview(cookieHeader);
  } catch {
    loadError = '마이페이지 정보를 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  try {
    const cookieHeader = (await headers()).get('cookie') ?? undefined;
    profile = await getMyProfile(cookieHeader);
  } catch {
    profileLoadError = '프로필 정보를 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  return (
    <MyPageClient
      overview={overview}
      loadError={loadError}
      nickname={nickname}
      profile={profile}
      profileLoadError={profileLoadError}
    />
  );
}
