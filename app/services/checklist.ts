import { useMockData } from '../config/dataSource';
import { ApiError, requestJson } from '../lib/api/http';
import { type ChecklistSummary } from '../lib/checklistSummary';
import { mapChecklistDto, mapChecklistItemDto, mapChecklistResultDto } from '../mappers/checklist';
import { getMockChecklist, getMockChecklistResult, updateMockChecklistItem } from '../repositories/checklistRepository';
import {
  type ChecklistDto,
  type ChecklistItemDto,
  type ChecklistItemUpdateRequestDto,
  type ChecklistResultDto,
} from '../types/api';
import { type Checklist, type ChecklistItem } from '../types/domain';

export async function createOrGetChecklist(propertyId: number): Promise<Checklist> {
  if (useMockData) {
    return getMockChecklist(propertyId);
  }

  try {
    const dto = await requestJson<ChecklistDto>(`/properties/${propertyId}/checklists`, { method: 'GET' });
    return mapChecklistDto(dto);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      const dto = await requestJson<ChecklistDto>(`/properties/${propertyId}/checklists`, { method: 'POST' });
      return mapChecklistDto(dto);
    }
    throw error;
  }
}

export async function getChecklistResult(checklistId: number): Promise<ChecklistSummary> {
  if (useMockData) {
    return getMockChecklistResult();
  }

  const dto = await requestJson<ChecklistResultDto>(`/checklists/${checklistId}/result`);
  return mapChecklistResultDto(dto);
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
