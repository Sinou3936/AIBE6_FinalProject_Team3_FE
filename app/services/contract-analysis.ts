import { useMockData } from '../config/dataSource';
import { requestJson } from '../lib/api/http';
import { mapContractInfoItemDto, mapContractRiskItemDto } from '../mappers/contract-analysis';
import { getMockContractAnalysisResult } from '../repositories/contractAnalysisRepository';
import { type ContractInfoItemDto, type ContractRiskItemDto } from '../types/api';
import { type ContractInfoItem, type ContractRiskItem } from '../types/domain';

type ContractAnalysisResult = {
  riskItems: ContractRiskItem[];
  contractInfoItems: ContractInfoItem[];
};

type ContractAnalysisResultDto = {
  riskItems: ContractRiskItemDto[];
  contractInfoItems: ContractInfoItemDto[];
};

export async function analyzeContractSpecialTerms(text: string): Promise<ContractAnalysisResult> {
  if (useMockData) {
    return getMockContractAnalysisResult();
  }

  const dto = await requestJson<ContractAnalysisResultDto>('/contracts/special-terms/analyze', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });

  return {
    riskItems: dto.riskItems.map(mapContractRiskItemDto),
    contractInfoItems: dto.contractInfoItems.map(mapContractInfoItemDto),
  };
}
