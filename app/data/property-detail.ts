import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { type PropertyRiskSummary } from '../types/domain';

export const riskSummaries: PropertyRiskSummary[] = [
  {
    icon: TrendingUp,
    title: '실거래가 비교',
    description: '주변 유사 매물 평균보다 높습니다. 가격 산정 근거와 최근 거래 내역을 확인하세요.',
    iconBoxClass: 'bg-orange-50',
    iconClass: 'text-orange-600',
  },
  {
    icon: AlertCircle,
    title: '보증금 안전성',
    description: '전세가율이 80%를 넘는 경우 집값 하락 시 보증금 반환 위험이 커질 수 있습니다.',
    iconBoxClass: 'bg-red-50',
    iconClass: 'text-red-600',
  },
  {
    icon: CheckCircle2,
    title: '허위매물 의심 신호',
    description: '동일 주소나 유사 조건으로 등록된 매물이 있는지 별도로 확인하세요.',
    iconBoxClass: 'bg-emerald-50',
    iconClass: 'text-emerald-600',
  },
];
