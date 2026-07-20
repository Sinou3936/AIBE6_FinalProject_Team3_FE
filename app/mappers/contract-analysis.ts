import { type ContractInfoItem, type ContractRiskItem } from '../types/domain';
import { type ContractInfoItemDto, type ContractRiskItemDto } from '../types/api';

const contractRiskLevelColorMap: Record<ContractRiskItemDto['severityTone'], string> = {
  orange: 'text-orange-700 bg-orange-50 border-orange-100',
  red: 'text-red-700 bg-red-50 border-red-100',
};

export function mapContractRiskItemDto(dto: ContractRiskItemDto): ContractRiskItem {
  return {
    id: dto.id,
    original: dto.original,
    level: '확인 필요',
    levelColor: contractRiskLevelColorMap[dto.severityTone],
    simple: dto.simple,
    why: dto.why,
    question: dto.question,
    suggestion: dto.suggestion,
  };
}

export function mapContractInfoItemDto(dto: ContractInfoItemDto): ContractInfoItem {
  return [dto.label, dto.value];
}
