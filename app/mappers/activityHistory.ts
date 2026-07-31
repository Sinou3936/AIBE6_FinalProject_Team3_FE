import { type ActivityHistoryItemDto } from '../types/api';
import { type ActivityHistoryItem } from '../types/domain';

export function mapActivityHistoryItemDto(dto: ActivityHistoryItemDto): ActivityHistoryItem {
  return {
    title: dto.title,
    type: dto.type,
    date: dto.date,
    status: dto.status,
  };
}
