import { mapContractInfoItemDto, mapContractRiskItemDto } from '../mappers/contract-analysis';
import { initContractInfoItemDtos, initContractRiskItemDtos } from '../mocks/init/contract-analysis';
import { type ContractInfoItem, type ContractRiskItem } from '../types/domain';

export type MockContractAnalysisResult = {
  riskItems: ContractRiskItem[];
  contractInfoItems: ContractInfoItem[];
};

const mockContractAnalysisResult: MockContractAnalysisResult = {
  riskItems: initContractRiskItemDtos.map(mapContractRiskItemDto),
  contractInfoItems: initContractInfoItemDtos.map(mapContractInfoItemDto),
};

export function getMockContractAnalysisResult(): MockContractAnalysisResult {
  return mockContractAnalysisResult;
}
