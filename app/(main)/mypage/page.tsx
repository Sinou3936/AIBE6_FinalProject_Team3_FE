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
  let overview = emptyOverview;
  let loadError: string | undefined;
  let profile = emptyProfile;
  let profileLoadError: string | undefined;

  try {
    overview = await getMyPageOverview();
  } catch {
    loadError = '마이페이지 정보를 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  try {
    profile = await getMyProfile();
  } catch {
    profileLoadError = '프로필 정보를 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  return (
    <MyPageClient overview={overview} loadError={loadError} profile={profile} profileLoadError={profileLoadError} />
  );
}
