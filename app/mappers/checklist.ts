import {
  type ChecklistCategoryDto,
  type ChecklistDto,
  type ChecklistImportanceDto,
  type ChecklistItemDto,
  type ChecklistItemTypeDto,
} from '../types/api';
import {
  type Checklist,
  type ChecklistCategoryId,
  type ChecklistImportance,
  type ChecklistItem,
  type ChecklistItemType,
} from '../types/domain';

// Backend enum은 JSON에 대문자로 내려온다(예: "INDOOR"). 기존 화면 코드(카테고리 탭 아이콘 등)는
// 소문자를 쓰고 있어서 그 쪽을 고치는 대신 여기서만 변환한다.
const categoryMap: Record<ChecklistCategoryDto, ChecklistCategoryId> = {
  INDOOR: 'indoor',
  NOISE: 'noise',
  SAFETY: 'safety',
  DOCUMENTS: 'documents',
  AREA: 'area',
};

const itemTypeMap: Record<ChecklistItemTypeDto, ChecklistItemType> = {
  CHECK: 'check',
  YES_NO: 'yesNo',
  DATE: 'date',
  DOCUMENT_REQUEST: 'documentRequest',
};

const importanceMap: Record<ChecklistImportanceDto, ChecklistImportance> = {
  REQUIRED: 'required',
  GENERAL: 'general',
};

export function mapChecklistItemDto(dto: ChecklistItemDto): ChecklistItem {
  return {
    id: dto.id,
    category: categoryMap[dto.category],
    content: dto.content,
    guideText: dto.guideText,
    importance: importanceMap[dto.importance],
    itemType: itemTypeMap[dto.itemType],
    checked: dto.checked,
    issueFound: dto.issueFound,
    value: dto.value,
  };
}

export function mapChecklistDto(dto: ChecklistDto): Checklist {
  return {
    id: dto.id,
    propertyId: dto.propertyId,
    items: dto.items.map(mapChecklistItemDto),
  };
}
