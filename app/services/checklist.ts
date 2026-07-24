import { useMockData } from '../config/dataSource';
import { requestJson } from '../lib/api/http';
import { mapChecklistDto, mapChecklistItemDto } from '../mappers/checklist';
import { getMockChecklist, updateMockChecklistItem } from '../repositories/checklistRepository';
import { type ChecklistDto, type ChecklistItemDto, type ChecklistItemUpdateRequestDto } from '../types/api';
import { type Checklist, type ChecklistItem } from '../types/domain';

export async function createOrGetChecklist(propertyId: number): Promise<Checklist> {
  if (useMockData) {
    return getMockChecklist(propertyId);
  }

  const dto = await requestJson<ChecklistDto>(`/properties/${propertyId}/checklists`, { method: 'POST' });
  return mapChecklistDto(dto);
}

export async function updateChecklistItem(
  checklistId: number,
  itemId: number,
  request: ChecklistItemUpdateRequestDto,
): Promise<ChecklistItem> {
  if (useMockData) {
    return updateMockChecklistItem(itemId, request);
  }

  const dto = await requestJson<ChecklistItemDto>(`/checklists/${checklistId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
  return mapChecklistItemDto(dto);
}
