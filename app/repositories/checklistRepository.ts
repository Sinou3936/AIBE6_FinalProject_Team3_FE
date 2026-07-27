import { mapChecklistDto, mapChecklistItemDto, mapChecklistResultDto } from '../mappers/checklist';
import { initChecklistItemDtos } from '../mocks/init/checklist';
import { type ChecklistItemUpdateRequestDto, type ChecklistStatusDto } from '../types/api';
import { type Checklist, type ChecklistItem } from '../types/domain';
import { type ChecklistSummary } from '../lib/checklistSummary';

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
      return { ...item, checked: request.checked, userNote: null, issueFound: false };
    }
    if ('userNote' in request) {
      return { ...item, checked: true, userNote: request.userNote, issueFound: true };
    }
    return { ...item, value: request.value, checked: true };
  });

  const updated = mockChecklistItemDtos.find((item) => item.id === itemId);
  if (!updated) {
    throw new Error(`Mock checklist item ${itemId} not found.`);
  }

  return mapChecklistItemDto(updated);
}

// Backend Checklist.refreshStatus()/computeResult()와 동일한 규칙을 mock에서도 그대로 흉내낸다.
export function getMockChecklistResult(): ChecklistSummary {
  const totalCount = mockChecklistItemDtos.length;
  const checkedCount = mockChecklistItemDtos.filter((item) => item.checked).length;
  const requiredMissingCount = mockChecklistItemDtos.filter(
    (item) => item.importance === 'REQUIRED' && !item.checked,
  ).length;
  const issueCount = mockChecklistItemDtos.filter((item) => item.issueFound).length;

  let status: ChecklistStatusDto;
  if (checkedCount === 0) {
    status = 'NOT_STARTED';
  } else {
    const allRequiredChecked = mockChecklistItemDtos
      .filter((item) => item.importance === 'REQUIRED')
      .every((item) => item.checked);
    status = allRequiredChecked ? 'COMPLETED' : 'IN_PROGRESS';
  }

  return mapChecklistResultDto({
    status,
    checkedCount,
    totalCount,
    requiredMissingCount,
    issueCount,
    message: status === 'NOT_STARTED' ? '체크리스트를 시작해보세요' : undefined,
  });
}
