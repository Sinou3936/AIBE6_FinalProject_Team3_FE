import { ENABLE_ANALYSIS_HISTORY } from '../config/features';
import { useMockData } from '../config/dataSource';
import { requestJson } from '../lib/api/http';
import { mapActivityHistoryItemDto } from '../mappers/activityHistory';
import { getMockActivityHistory } from '../repositories/activityHistoryRepository';
import { type ActivityHistoryItemDto } from '../types/api';
import { type ActivityHistoryItem } from '../types/domain';

// 매물 검증/특약사항 분석/현장 기록 등 여러 타입이 섞인 최근 활동 내역이다 - "마이페이지 전체
// 요약"이 아니라 이 목록 하나만 담당한다(등록 매물 목록은 app/services/properties.ts의
// getProperties()를 따로 쓴다). 백엔드에 아직 이 엔드포인트가 없어 실제로 호출하면 항상 실패하므로,
// ENABLE_ANALYSIS_HISTORY가 꺼져 있는 동안은 아예 호출을 건너뛰고 빈 배열을 바로 반환한다 -
// 매번 실패가 뻔한 왕복(홈/마이페이지가 병렬로 묶어 부르는 조회 중 하나)을 만들지 않기 위함이다.
// 엔드포인트가 생기면(팀원이 특약사항 분석 결과를 DB에 저장하게 되면) 이 플래그만 켜면 된다.
export async function getActivityHistory(cookieHeader?: string): Promise<ActivityHistoryItem[]> {
  if (useMockData) {
    return getMockActivityHistory();
  }

  if (!ENABLE_ANALYSIS_HISTORY) {
    return [];
  }

  const dtos = await requestJson<ActivityHistoryItemDto[]>(
    '/users/me/activity-history',
    cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined,
  );
  return dtos.map(mapActivityHistoryItemDto);
}
