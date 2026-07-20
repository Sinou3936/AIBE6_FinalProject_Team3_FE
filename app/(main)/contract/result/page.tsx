import { analyzeContractSpecialTerms } from '../../../services/contract-analysis';
import { type ContractInfoItem, type ContractRiskItem } from '../../../types/domain';
import { ContractResultClient } from './ContractResultClient';

export const dynamic = 'force-dynamic';

const demoSpecialTermsText =
  '임대인은 개인 사정에 따라 계약 기간 중 목적물 명도를 요청할 수 있다. 보증금 반환은 새로운 임차인이 들어온 이후에 지급하기로 한다.';

export default async function Page() {
  let riskItems: ContractRiskItem[] = [];
  let contractInfoItems: ContractInfoItem[] = [];
  let loadError: string | undefined;

  try {
    const result = await analyzeContractSpecialTerms(demoSpecialTermsText);
    riskItems = result.riskItems;
    contractInfoItems = result.contractInfoItems;
  } catch {
    loadError = '계약 분석 결과를 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  return <ContractResultClient riskItems={riskItems} contractInfoItems={contractInfoItems} loadError={loadError} />;
}
