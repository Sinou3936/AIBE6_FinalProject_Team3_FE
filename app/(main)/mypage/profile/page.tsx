'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  EMPTY_RESOLVED_INTEREST_REGION,
  resolveInterestRegion,
  type ResolvedInterestRegion,
} from '../../../lib/interestRegion';
import { hasRegisteredProfile } from '../../../lib/profile';
import { classifyProfileLoadError } from '../../../lib/sessionErrors';
import { getMyProfile, getNicknamePolicy } from '../../../services/user';
import { type NicknamePolicyDto } from '../../../types/api';
import { type UserProfile } from '../../../types/domain';
import { AccountUnavailableRedirect } from '../../../ui/AccountUnavailableRedirect';
import { ProfileClient } from './ProfileClient';

const emptyProfile: UserProfile = {
  nickname: '',
  email: null,
  profileImageUrl: null,
  interestRegion: null,
  transactionType: null,
  hasPassword: false,
};

// backend가 내려오지 않는 극히 드문 경우에만 쓰는 최후의 fallback이다 — 평소엔 항상
// getNicknamePolicy()가 실제 정책을 받아오므로, 이 값이 실제 정책과 어긋나도 서버가 최종
// 검증에서 걸러주니 이중 실패로 이어지지 않는다.
const FALLBACK_NICKNAME_POLICY: NicknamePolicyDto = {
  pattern: '[가-힣a-zA-Z0-9]{2,20}',
  message: '닉네임은 한글, 영문, 숫자로 2~20자여야 합니다.',
};

export default function Page() {
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nicknamePolicy, setNicknamePolicy] = useState<NicknamePolicyDto>(FALLBACK_NICKNAME_POLICY);
  const [resolvedRegion, setResolvedRegion] = useState<ResolvedInterestRegion>(EMPTY_RESOLVED_INTEREST_REGION);

  useEffect(() => {
    let cancelled = false;
    getMyProfile()
      .then(async (result) => {
        if (cancelled) return;
        setProfile(result);
        // 시·군·구/읍·면·동 옵션은 이제 온디맨드로 받아오므로(app/api/regions/*), 이미 저장된
        // interestRegion을 select에 되돌리려면 그 값에 필요한 옵션 목록까지 먼저 받아와야 한다 -
        // 여기서(이 화면이 이미 갖고 있던 로딩 게이트 안에서) 끝내야 ProfileClient가 마운트된 뒤에
        // select가 비었다가 나중에 채워지는 깜빡임 없이 바로 올바른 값으로 렌더링된다.
        try {
          const resolved = await resolveInterestRegion(result.interestRegion);
          if (!cancelled) setResolvedRegion(resolved);
        } catch {
          // 실패해도 폼 자체는 계속 써야 하므로 빈 상태로 폴백한다 - 사용자가 지역을 다시
          // 선택하면 되는 정도의 손실이라, 화면 진입 자체를 막지 않는다.
          if (!cancelled) setResolvedRegion(EMPTY_RESOLVED_INTEREST_REGION);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        // 인증 판단/리다이렉트는 MainLayoutGate.tsx 한 곳에서만 한다 - 여기서는 실패해도
        // 재로그인으로 보내지 않고 프로필 데이터 조회 실패로만 취급한다.
        switch (classifyProfileLoadError(error)) {
          case 'not-found':
            setProfileNotFound(true);
            break;
          default:
            setLoadError('프로필 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getNicknamePolicy()
      .then((result) => {
        if (!cancelled) setNicknamePolicy(result);
      })
      .catch(() => {
        // 조회 실패해도 폴백 정책으로 폼은 계속 동작해야 한다.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const mode = hasRegisteredProfile(profile) ? 'edit' : 'register';

  return (
    <>
      {profileNotFound && <AccountUnavailableRedirect />}
      <ProfileClient
        profile={profile}
        mode={mode}
        loadError={loadError}
        nicknamePolicy={nicknamePolicy}
        initialLocation={resolvedRegion.location}
        initialSigunguOptions={resolvedRegion.sigunguOptions}
        initialEupmyeondongOptions={resolvedRegion.eupmyeondongOptions}
      />
    </>
  );
}
