import { useMockData } from '../config/dataSource';
import { requestJson } from '../lib/api/http';
import { mapActivityHistoryItemDto } from '../mappers/activityHistory';
import { getMockActivityHistory } from '../repositories/activityHistoryRepository';
import { type ActivityHistoryItemDto } from '../types/api';
import { type ActivityHistoryItem } from '../types/domain';

// 매물 검증/특약사항 분석/현장 기록 등 여러 타입이 섞인 최근 활동 내역이다 - "마이페이지 전체
// 요약"이 아니라 이 목록 하나만 담당한다(등록 매물 목록은 app/services/properties.ts의
// getProperties()를 따로 쓴다). 백엔드에 아직 이 엔드포인트가 없어 실제 API 모드에서는 항상
// 실패하고, 특약사항 분석은 그중에서도 결과를 저장하는 기능 자체가 없어서 엔드포인트가 생긴
// 뒤에도 한동안은 계속 비어있을 수 있다(호출부의 개별 주석 참고).
export async function getActivityHistory(cookieHeader?: string): Promise<ActivityHistoryItem[]> {
  if (useMockData) {
    return getMockActivityHistory();
  }

  const dtos = await requestJson<ActivityHistoryItemDto[]>(
    '/users/me/activity-history',
    cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined,
  );
  return dtos.map(mapActivityHistoryItemDto);
}
