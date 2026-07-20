import { mapPropertySummaryDto } from './property';
import { type ActivityHistoryItemDto, type MyPageOverviewDto } from '../types/api';
import { type ActivityHistoryItem, type MyPageOverview } from '../types/domain';

export function mapActivityHistoryItemDto(dto: ActivityHistoryItemDto): ActivityHistoryItem {
  return {
    title: dto.title,
    type: dto.type,
    date: dto.date,
    status: dto.status,
  };
}

export function mapMyPageOverviewDto(dto: MyPageOverviewDto): MyPageOverview {
  return {
    activityHistory: dto.activityHistory.map(mapActivityHistoryItemDto),
    bookmarkedProperties: dto.bookmarkedProperties.map(mapPropertySummaryDto),
  };
}
