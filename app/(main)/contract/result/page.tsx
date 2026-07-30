import { type ContractAnalysisResult } from '../../../types/domain';
import { ContractResultClient } from './ContractResultClient';

export const dynamic = 'force-dynamic';

type ResultPageProps = {
  searchParams: Promise<{ data?: string }>;
};

// upload 화면이 4단계 파이프라인을 전부 마친 뒤 결과를 base64url로 인코딩해 넘겨준다.
// 이 페이지는 그 결과를 그대로 디코딩해서 보여줄 뿐, 서버에 재요청하지 않는다(분석 결과 무저장 정책).
function decodeContractAnalysisResult(data: string): ContractAnalysisResult {
  return JSON.parse(Buffer.from(data, 'base64url').toString('utf-8')) as ContractAnalysisResult;
}

export default async function Page({ searchParams }: ResultPageProps) {
  const { data } = await searchParams;

  let result: ContractAnalysisResult | undefined;
  let loadError: string | undefined;

  if (!data) {
    loadError = '분석 결과를 찾을 수 없습니다. 특약사항 입력부터 다시 진행해 주세요.';
  } else {
    try {
      result = decodeContractAnalysisResult(data);
    } catch {
      loadError = '분석 결과를 불러오지 못했습니다. 특약사항 입력부터 다시 진행해 주세요.';
    }
  }

  return (
    <ContractResultClient
      clauses={result?.clauses ?? []}
      summary={result?.summary}
      aiGeneratedNotice={result?.aiGeneratedNotice}
      disclaimer={result?.disclaimer}
      loadError={loadError}
    />
  );
}
