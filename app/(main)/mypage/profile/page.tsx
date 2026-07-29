import { headers } from 'next/headers';
import { hasRegisteredProfile } from '../../../lib/profile';
import { classifyProfileLoadError } from '../../../lib/sessionErrors';
import { getMyProfile } from '../../../services/user';
import { type UserProfile } from '../../../types/domain';
import { AccountUnavailableRedirect } from '../../../ui/AccountUnavailableRedirect';
import { ProfileClient } from './ProfileClient';

export const dynamic = 'force-dynamic';

const emptyProfile: UserProfile = {
  nickname: '',
  profileImageUrl: null,
  interestRegion: null,
  transactionType: null,
  currentStage: null,
  hasPassword: false,
};

export default async function Page() {
  let profile = emptyProfile;
  let loadError: string | undefined;
  let profileNotFound = false;

  try {
    const cookieHeader = (await headers()).get('cookie') ?? undefined;
    profile = await getMyProfile(cookieHeader);
  } catch (error) {
    if (classifyProfileLoadError(error) === 'not-found') {
      profileNotFound = true;
    } else {
      loadError = '프로필 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    }
  }

  const mode = hasRegisteredProfile(profile) ? 'edit' : 'register';

  return (
    <>
      {profileNotFound && <AccountUnavailableRedirect />}
      <ProfileClient profile={profile} mode={mode} loadError={loadError} />
    </>
  );
}
