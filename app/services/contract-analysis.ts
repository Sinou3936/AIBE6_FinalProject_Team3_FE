import { useMockData } from '../config/dataSource';
import { requestJson } from '../lib/api/http';
import { mapContractAnalysisResultDto } from '../mappers/contract-analysis';
import { getMockContractAnalysisResult } from '../repositories/contractAnalysisRepository';
import {
  type ContractAnalysisResultDto,
  type ContractAnalyzeRequestDto,
  type ContractInputRequestDto,
  type ContractInputResponseDto,
  type ContractMaskingRequestDto,
  type ContractMaskingResponseDto,
  type OcrExtractResponseDto,
} from '../types/api';
import { type ContractAnalysisResult } from '../types/domain';

// 서버는 분석 결과를 포함해 아무 것도 저장하지 않는 정책이라(이력 조회 목적 저장 없음),
// 이전 단계 응답값을 클라이언트가 들고 있다가 다음 단계 요청에 그대로 실어 보내는 구조다.
// mock 모드에서는 1~3단계를 입력값 그대로 통과시키고, 최종 분석 단계만 app/mocks/init 데이터를 반환한다.

export async function submitContractInput(text: string): Promise<ContractInputResponseDto> {
  if (useMockData) {
    return { inputType: 'TEXT', readyForNextStep: true, nextStep: 'MASKING' };
  }

  return requestJson<ContractInputResponseDto>('/contract-analysis/inputs', {
    method: 'POST',
    body: JSON.stringify({ inputType: 'TEXT', text } satisfies ContractInputRequestDto),
  });
}

// 이미지 입력 경로용(submitContractInput의 nextStep이 'OCR'일 때). 텍스트 직접 입력 화면에서는
// 호출되지 않지만, 이미지 업로드가 실제로 붙을 때 재사용할 수 있도록 스펙대로 구현해 둔다.
export async function extractOcrText(image: File): Promise<string> {
  if (useMockData) {
    return '';
  }

  const formData = new FormData();
  formData.append('image', image);

  const dto = await requestJson<OcrExtractResponseDto>('/contract-analysis/ocr', {
    method: 'POST',
    body: formData,
  });

  return dto.extractedText;
}

export async function maskContractText(text: string): Promise<string> {
  if (useMockData) {
    return text;
  }

  const dto = await requestJson<ContractMaskingResponseDto>('/contract-analysis/masking', {
    method: 'POST',
    body: JSON.stringify({ text } satisfies ContractMaskingRequestDto),
  });

  return dto.maskedText;
}

export async function analyzeContract(maskedText: string, userConfirmed: boolean): Promise<ContractAnalysisResult> {
  if (useMockData) {
    return getMockContractAnalysisResult();
  }

  const dto = await requestJson<ContractAnalysisResultDto>('/contract-analysis/analyze', {
    method: 'POST',
    body: JSON.stringify({ maskedText, userConfirmed } satisfies ContractAnalyzeRequestDto),
  });

  return mapContractAnalysisResultDto(dto);
}
