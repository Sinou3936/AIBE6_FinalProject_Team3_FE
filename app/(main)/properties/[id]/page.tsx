import { cookies } from 'next/headers';
import { getPropertyById } from '../../../services/properties';
import { checkRiskSignals, getDepositSafety, getRiskSignals } from '../../../services/risk-analysis';
import { type DepositSafetyCheck, type PropertyDetail, type RiskSignalList } from '../../../types/domain';
import { PropertyDetailClient } from './PropertyDetailClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const propertyId = Number(id);
  const cookieHeader = (await cookies()).toString();

  let property: PropertyDetail | undefined;
  let loadError: string | undefined;

  try {
    property = await getPropertyById(propertyId, cookieHeader);
  } catch {
    loadError = '매물 정보를 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  // 위험 신호/보증금 안전성은 매물 상세의 부가 정보라, 조회 실패해도 매물 본문은 그대로 보여준다.
  let riskSignals: RiskSignalList | undefined;
  let depositSafety: DepositSafetyCheck | undefined;
  try {
    await checkRiskSignals(propertyId, cookieHeader);
    riskSignals = await getRiskSignals(propertyId, cookieHeader);
    depositSafety = await getDepositSafety(propertyId, cookieHeader);
  } catch {
    riskSignals = undefined;
    depositSafety = undefined;
  }

  return (
    <PropertyDetailClient
      property={property}
      loadError={loadError}
      riskSignals={riskSignals}
      depositSafety={depositSafety}
    />
  );
}
