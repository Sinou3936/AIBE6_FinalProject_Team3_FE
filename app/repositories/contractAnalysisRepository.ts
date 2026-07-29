import { mapContractAnalysisResultDto } from '../mappers/contract-analysis';
import { initContractAnalysisResultDto } from '../mocks/init/contract-analysis';
import { type ContractAnalysisResult } from '../types/domain';

const mockContractAnalysisResult: ContractAnalysisResult = mapContractAnalysisResultDto(initContractAnalysisResultDto);

export function getMockContractAnalysisResult(): ContractAnalysisResult {
  return mockContractAnalysisResult;
}
