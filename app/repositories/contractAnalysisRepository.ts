import {
  mapContractAnalysisResultDto,
  mapContractHistoryClauseDto,
  mapContractHistoryItemDto,
} from '../mappers/contract-analysis';
import {
  initContractAnalysisResultDto,
  initContractHistoryClauseDtos,
  initContractHistoryItemDtos,
} from '../mocks/init/contract-analysis';
import { type ContractAnalysisResult, type ContractClause, type ContractHistoryPage } from '../types/domain';

const mockContractAnalysisResult: ContractAnalysisResult = mapContractAnalysisResultDto(initContractAnalysisResultDto);

export function getMockContractAnalysisResult(): ContractAnalysisResult {
  return mockContractAnalysisResult;
}

// 삭제(deleteMockContractHistoryItem)를 흉내내려면 모듈 상태가 변경 가능해야 해서, checklistRepository.ts의
// mockChecklistItemDtos와 동일하게 정적 시드(mocks/init)를 그대로 쓰지 않고 let으로 복사해둔다.
let mockContractHistoryItemDtos = [...initContractHistoryItemDtos];

// checklistRepository.ts의 getMockChecklistOverviews와 동일한 패턴 - mock은 정렬/페이지네이션을
// 그 자리에서 직접 슬라이싱해 흉내낸다(Backend는 항상 createdAt 최신순 고정).
export function getMockContractHistoryPage(page = 0, size = 5): ContractHistoryPage {
  const allItems = mockContractHistoryItemDtos.map(mapContractHistoryItemDto);
  const totalElements = allItems.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const start = page * size;
  const items = allItems.slice(start, start + size);

  return {
    items,
    page,
    size,
    totalElements,
    totalPages,
    hasNext: page + 1 < totalPages,
  };
}

export function deleteMockContractHistoryItem(id: number): void {
  mockContractHistoryItemDtos = mockContractHistoryItemDtos.filter((item) => item.id !== id);
}

const mockContractHistoryClauses: ContractClause[] = initContractHistoryClauseDtos.map(mapContractHistoryClauseDto);

// getMockContractAnalysisResult와 동일하게, id와 무관하게 항상 같은 mock 조항 목록을 돌려준다.
export function getMockContractHistoryClauses(): ContractClause[] {
  return mockContractHistoryClauses;
}
