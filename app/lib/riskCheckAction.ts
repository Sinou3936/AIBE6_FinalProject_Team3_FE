import { type PropertySummary } from '../types/domain';

type RiskCheckHrefInput = {
  properties: PropertySummary[];
  signalProperties: PropertySummary[];
};

// 홈 화면 "위험 신호 확인" 빠른 실행 카드가 실제 매물/신호 상태에 맞춰 이동하도록 한다 -
// 예전엔 app/data/dashboard.ts에 `/properties/1`로 하드코딩돼 있어 실제로는 존재하지도 않거나
// 본인 소유가 아닌 매물로 보낼 수 있었다.
export function getRiskCheckHref({ properties, signalProperties }: RiskCheckHrefInput): string {
  if (properties.length === 0) {
    return '/properties/register';
  }
  if (signalProperties.length === 1) {
    return `/properties/${signalProperties[0].id}/risk-analysis`;
  }
  return '/properties';
}
