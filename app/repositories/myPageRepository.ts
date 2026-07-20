import { initActivityHistoryDtos } from '../mocks/init/mypage';
import { mapActivityHistoryItemDto } from '../mappers/mypage';
import { getMockBookmarkedProperties } from './propertyRepository';
import { type MyPageOverview } from '../types/domain';

const mockMyPageOverview: MyPageOverview = {
  activityHistory: initActivityHistoryDtos.map(mapActivityHistoryItemDto),
  bookmarkedProperties: getMockBookmarkedProperties(),
};

export function getMockMyPageOverview(): MyPageOverview {
  return mockMyPageOverview;
}
