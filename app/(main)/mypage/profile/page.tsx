import { headers } from 'next/headers';
import { hasRegisteredProfile } from '../../../lib/profile';
import { getMyProfile } from '../../../services/user';
import { type UserProfile } from '../../../types/domain';
import { ProfileClient } from './ProfileClient';

export const dynamic = 'force-dynamic';

const emptyProfile: UserProfile = {
  nickname: '',
  profileImageUrl: null,
  interestRegion: null,
  transactionType: null,
  currentStage: null,
};

export default async function Page() {
  let profile = emptyProfile;
  let loadError: string | undefined;

  try {
    const cookieHeader = (await headers()).get('cookie') ?? undefined;
    profile = await getMyProfile(cookieHeader);
  } catch {
    loadError = '프로필 정보를 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  const mode = hasRegisteredProfile(profile) ? 'edit' : 'register';

  return <ProfileClient profile={profile} mode={mode} loadError={loadError} />;
}
