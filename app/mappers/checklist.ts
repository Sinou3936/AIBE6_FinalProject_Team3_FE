import { type ChecklistItem } from '../types/domain';
import { type ChecklistItemDto } from '../types/api';

export function mapChecklistItemDto(dto: ChecklistItemDto): ChecklistItem {
  return {
    id: dto.id,
    category: dto.category,
    text: dto.text,
    status: dto.status,
  };
}
