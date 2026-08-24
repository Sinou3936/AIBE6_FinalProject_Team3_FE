// 시·군·구/읍·면·동은 백엔드가 관여하지 않는 순수 프론트 정적 데이터라, 다른 services/*.ts처럼
// useMockData로 목/실 API를 나누지 않는다 - 이 프로젝트 자체 Route Handler(app/api/regions/*)가
// regions_nested.ts를 그대로 감싸 내려줄 뿐이라 나눌 대상이 없다. 그래서 requestJson()(백엔드
// NEXT_PUBLIC_API_BASE_URL 전용) 대신 같은 오리진 상대 경로로 fetch한다.
async function fetchRegionNames(path: string, key: 'sigungu' | 'eupmyeondong'): Promise<string[]> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`지역 목록을 불러오지 못했습니다. (${response.status})`);
  }
  const data = (await response.json()) as Record<typeof key, string[]>;
  return data[key];
}

export function fetchSigunguOptions(sido: string): Promise<string[]> {
  return fetchRegionNames(`/api/regions/sigungu?sido=${encodeURIComponent(sido)}`, 'sigungu');
}

export function fetchEupmyeondongOptions(sido: string, sigungu: string): Promise<string[]> {
  const params = new URLSearchParams({ sido, sigungu });
  return fetchRegionNames(`/api/regions/eupmyeondong?${params.toString()}`, 'eupmyeondong');
}
