import { Building2, CheckCircle2, MapPin, ShieldAlert } from 'lucide-react';
import { type FeatureCardData, type PropertyTradeType } from '../types/domain';

export const tradeTypeOptions = ['전세', '월세', '반전세'] as const satisfies readonly PropertyTradeType[];

export const propertyBasicFields: Array<{
  label: string;
  placeholder: string;
  icon?: FeatureCardData['icon'];
}> = [
  { label: '매물 제목', placeholder: '예: 신림역 도보권 원룸 전세' },
  { label: '주소', placeholder: '도로명 또는 지번 주소', icon: MapPin },
];

export const propertyPriceFields = [
  { label: '보증금', placeholder: '예: 18000만원' },
  { label: '월세', placeholder: '예: 0만원' },
];

export const propertyRegisterFeatureCards: FeatureCardData[] = [
  { icon: Building2, title: '실거래가 비교', description: '주소 기준 주변 거래를 비교합니다.' },
  { icon: ShieldAlert, title: '보증금 안전성', description: '전세가율 수치와 확인 필요 신호를 계산합니다.' },
  { icon: CheckCircle2, title: '현장 체크 연동', description: '등록 후 임장 체크리스트로 이어집니다.' },
];
