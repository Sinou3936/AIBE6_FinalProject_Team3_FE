import { useMockData } from '../config/dataSource';
import { requestJson } from '../lib/api/http';
import { mapChecklistItemDto } from '../mappers/checklist';
import { getMockChecklistTemplate } from '../repositories/checklistRepository';
import { type ChecklistItemDto } from '../types/api';
import { type ChecklistItem, type PropertyTradeType } from '../types/domain';

export async function getChecklistTemplate(tradeType?: PropertyTradeType): Promise<ChecklistItem[]> {
  if (useMockData) {
    return getMockChecklistTemplate();
  }

  const searchParams = tradeType ? `?tradeType=${encodeURIComponent(tradeType)}` : '';
  const dtos = await requestJson<ChecklistItemDto[]>(`/checklists/template${searchParams}`);
  return dtos.map(mapChecklistItemDto);
}
