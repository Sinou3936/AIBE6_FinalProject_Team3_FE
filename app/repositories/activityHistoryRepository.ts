import { initActivityHistoryDtos } from '../mocks/init/activityHistory';
import { mapActivityHistoryItemDto } from '../mappers/activityHistory';
import { type ActivityHistoryItem } from '../types/domain';

const mockActivityHistory: ActivityHistoryItem[] = initActivityHistoryDtos.map(mapActivityHistoryItemDto);

export function getMockActivityHistory(): ActivityHistoryItem[] {
  return mockActivityHistory;
}
