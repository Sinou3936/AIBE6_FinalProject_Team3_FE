import { type PropertySummary } from '../types/domain';

/**
 * 홈 화면 "위험 신호 확인" 퀵액션 카드가 어디로 이동할지 결정한다(#181).
 *
 * 매물 목록에 확인 필요 신호(hasSignal) 필터가 생기기 전에는(fix/home-signal-card, PR #180)
 * 이 로직이 한 번 있었다가 "필터가 없으면 실효성이 애매하다"는 이유로 삭제되고 /properties
 * 고정 링크로 통일됐었다(app/data/dashboard.ts 주석 참고). 필터가 생겨 다시 되살린다.
 *
 * - 등록된 매물이 하나도 없으면: 매물부터 등록하게 유도한다.
 * - 신호 있는 매물이 정확히 1개면: 필터/목록을 거치지 않고 그 매물의 위험 신호 분석 화면으로 바로 보낸다.
 * - 신호 있는 매물이 0개면: hasSignal=true로 보내면 빈 목록만 보여 혼란스러우므로 전체 목록으로 보낸다.
 * - 신호 있는 매물이 2개 이상이면: hasSignal=true 필터가 적용된 목록으로 보낸다.
 */
export function getRiskCheckHref(hasProperty: boolean, signalProperties: PropertySummary[]): string {
  if (!hasProperty) {
    return '/properties/register';
  }
  if (signalProperties.length === 1) {
    return `/properties/${signalProperties[0].id}/risk-analysis`;
  }
  if (signalProperties.length === 0) {
    return '/properties';
  }
  return '/properties?hasSignal=true';
}
