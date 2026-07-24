import { mapChecklistDto, mapChecklistItemDto } from '../mappers/checklist';
import { initChecklistItemDtos } from '../mocks/init/checklist';
import { type ChecklistItemUpdateRequestDto } from '../types/api';
import { type Checklist, type ChecklistItem } from '../types/domain';

const MOCK_CHECKLIST_ID = 1;
const MOCK_TEMPLATE_VERSION = 1;

let mockChecklistItemDtos = initChecklistItemDtos.map((dto) => ({ ...dto }));

export function getMockChecklist(propertyId: number): Checklist {
  return mapChecklistDto({
    id: MOCK_CHECKLIST_ID,
    propertyId,
    templateVersion: MOCK_TEMPLATE_VERSION,
    status: 'IN_PROGRESS',
    items: mockChecklistItemDtos,
  });
}

export function updateMockChecklistItem(itemId: number, request: ChecklistItemUpdateRequestDto): ChecklistItem {
  mockChecklistItemDtos = mockChecklistItemDtos.map((item) => {
    if (item.id !== itemId) {
      return item;
    }
    if ('checked' in request) {
      return { ...item, checked: request.checked };
    }
    return { ...item, value: request.value, checked: true };
  });

  const updated = mockChecklistItemDtos.find((item) => item.id === itemId);
  if (!updated) {
    throw new Error(`Mock checklist item ${itemId} not found.`);
  }

  return mapChecklistItemDto(updated);
}
