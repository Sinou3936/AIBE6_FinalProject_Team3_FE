import { type ContractAnalysisResult, type ContractClause } from '../types/domain';
import { type ContractAnalysisResultDto, type ContractClauseDto } from '../types/api';

export function mapContractClauseDto(dto: ContractClauseDto): ContractClause {
  return {
    originalText: dto.originalText,
    riskFlag: dto.riskFlag,
    explanation: dto.explanation,
    question: dto.question,
    suggestedText: dto.suggestedText,
    levelLabel: dto.riskFlag ? '확인 필요' : '참고',
    levelColor: dto.riskFlag
      ? 'text-orange-700 bg-orange-50 border-orange-100'
      : 'text-slate-600 bg-slate-50 border-slate-100',
  };
}

export function mapContractAnalysisResultDto(dto: ContractAnalysisResultDto): ContractAnalysisResult {
  return {
    clauses: dto.clauses.map(mapContractClauseDto),
    summary: dto.summary,
    aiGeneratedNotice: dto.aiGeneratedNotice,
    disclaimer: dto.disclaimer,
  };
}
