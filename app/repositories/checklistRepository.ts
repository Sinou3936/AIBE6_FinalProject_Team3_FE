import { mapChecklistItemDto } from '../mappers/checklist';
import { initChecklistItemDtos } from '../mocks/init/checklist';
import { type ChecklistItem } from '../types/domain';

const mockChecklistItems: ChecklistItem[] = initChecklistItemDtos.map(mapChecklistItemDto);

export function getMockChecklistTemplate(): ChecklistItem[] {
  return mockChecklistItems;
}
