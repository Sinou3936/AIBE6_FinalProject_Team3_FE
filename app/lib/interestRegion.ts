import { sidoNames } from '../data/sido';
import { fetchEupmyeondongOptions, fetchSigunguOptions } from '../services/region';

export type ParsedLocation = { sido: string; sigungu: string; eupmyeondong: string };

export type ResolvedInterestRegion = {
  location: ParsedLocation;
  sigunguOptions: string[];
  eupmyeondongOptions: string[];
};

export const EMPTY_RESOLVED_INTEREST_REGION: ResolvedInterestRegion = {
  location: { sido: '', sigungu: '', eupmyeondong: '' },
  sigunguOptions: [],
  eupmyeondongOptions: [],
};

// 저장된 interestRegion 문자열("강원특별자치도 강릉시 강동면")을 select 3단에 필요한
// { sido, sigungu, eupmyeondong } 값과 각 단계의 옵션 목록을 함께 묶어 되돌린다. 옵션 목록까지
// 같이 반환하는 이유: <select value={sigungu}>가 그 값을 가진 <option>을 아직 안 갖고 있으면
// 브라우저는 빈 선택으로 보여준다 - 값과 그 값이 속한 옵션 목록을 같은 시점에 확정해야 마운트
// 시 깜빡임(잠깐 빈 값으로 보였다가 나중에 채워짐) 없이 바로 올바르게 렌더링된다. 호출부
// (mypage/profile/page.tsx)가 프로필 로딩 게이트 안에서 이 함수까지 기다린 뒤에만
// ProfileClient를 마운트하는 것도 같은 이유다.
export async function resolveInterestRegion(interestRegion: string | null): Promise<ResolvedInterestRegion> {
  if (!interestRegion) {
    return EMPTY_RESOLVED_INTEREST_REGION;
  }

  const matchedSido = sidoNames.find((name) => interestRegion === name || interestRegion.startsWith(`${name} `));
  if (!matchedSido) {
    return EMPTY_RESOLVED_INTEREST_REGION;
  }

  const rest = interestRegion.slice(matchedSido.length).trim();
  const sigunguOptions = await fetchSigunguOptions(matchedSido);
  if (!rest) {
    return { location: { sido: matchedSido, sigungu: '', eupmyeondong: '' }, sigunguOptions, eupmyeondongOptions: [] };
  }

  for (const sigunguName of sigunguOptions) {
    if (rest === sigunguName || rest.startsWith(`${sigunguName} `)) {
      const eupPart = rest.slice(sigunguName.length).trim();
      const eupmyeondongOptions = await fetchEupmyeondongOptions(matchedSido, sigunguName);
      const matchedEup = eupPart ? eupmyeondongOptions.find((name) => name === eupPart) : undefined;
      return {
        location: { sido: matchedSido, sigungu: sigunguName, eupmyeondong: matchedEup ?? '' },
        sigunguOptions,
        eupmyeondongOptions,
      };
    }
  }

  // 세종특별자치시처럼 시·군·구명이 시·도명과 같아 문자열에서 생략된 경우 - buildInterestRegion()이
  // sigungu === sido일 때만 그 구간을 생략하므로, 그 조합이 실제로 존재할 때만 시도해보면 된다
  // (모든 시·군·구를 돌며 읍·면·동까지 매번 fetch하는 건 낭비라 이 경우로 범위를 좁힌다).
  if (sigunguOptions.includes(matchedSido)) {
    const eupmyeondongOptions = await fetchEupmyeondongOptions(matchedSido, matchedSido);
    const matchedEup = eupmyeondongOptions.find((name) => name === rest);
    if (matchedEup) {
      return {
        location: { sido: matchedSido, sigungu: matchedSido, eupmyeondong: matchedEup },
        sigunguOptions,
        eupmyeondongOptions,
      };
    }
  }

  return { location: { sido: matchedSido, sigungu: '', eupmyeondong: '' }, sigunguOptions, eupmyeondongOptions: [] };
}

export function buildInterestRegion(sido: string, sigungu: string, eupmyeondong: string): string {
  if (!sido) {
    return '';
  }
  const parts = [sido];
  if (sigungu && sigungu !== sido) {
    parts.push(sigungu);
  }
  if (eupmyeondong) {
    parts.push(eupmyeondong);
  }
  return parts.join(' ');
}
