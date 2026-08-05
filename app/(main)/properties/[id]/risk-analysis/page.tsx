import { cookies } from 'next/headers';
import { getPropertyById } from '../../../../services/properties';
import { getDepositSafety, getRiskSignals } from '../../../../services/risk-analysis';
import { type DepositSafetyCheck, type PropertyDetail, type RiskSignalList } from '../../../../types/domain';
import { RiskAnalysisClient } from './RiskAnalysisClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const propertyId = Number(id);
  const cookieHeader = (await cookies()).toString();

  let riskSignals: RiskSignalList | undefined;
  let depositSafety: DepositSafetyCheck | undefined;
  let loadError: string | undefined;

  try {
    riskSignals = await getRiskSignals(propertyId, cookieHeader);
    depositSafety = await getDepositSafety(propertyId, cookieHeader);
  } catch {
    loadError = '위험 신호 정보를 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  // 매물 정보는 헤더 표시용 부가 정보라, 조회 실패해도 본문은 그대로 보여준다.
  let property: PropertyDetail | undefined;
  try {
    property = await getPropertyById(propertyId, cookieHeader);
  } catch {
    property = undefined;
  }

  return (
    <RiskAnalysisClient
      propertyId={propertyId}
      riskSignals={riskSignals}
      depositSafety={depositSafety}
      loadError={loadError}
      property={property}
    />
  );
}
