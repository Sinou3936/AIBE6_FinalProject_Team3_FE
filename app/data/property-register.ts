import { Building2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { type FeatureCardData } from '../types/domain';
import { type PropertyTransactionTypeDto, type PropertyTypeDto } from '../types/api';

// 백엔드가 실제로 지원하는 매물유형/거래유형만 옵션으로 노출한다 (반전세/매매는 서비스 대상 아님).
export const propertyTypeOptions: Array<{ value: PropertyTypeDto; label: string }> = [
  { value: 'OFFICETEL', label: '오피스텔' },
  { value: 'MULTI_FAMILY', label: '연립다세대' },
  { value: 'DETACHED_HOUSE', label: '단독/다가구' },
];

export const propertyTransactionTypeOptions: Array<{ value: PropertyTransactionTypeDto; label: string }> = [
  { value: 'JEONSE', label: '전세' },
  { value: 'MONTHLY_RENT', label: '월세' },
];

export const propertyRegisterFeatureCards: FeatureCardData[] = [
  { icon: Building2, title: '실거래가 비교', description: '주소 기준 주변 거래를 비교합니다.' },
  { icon: ShieldAlert, title: '보증금 안전성', description: '전세가율 수치와 확인 필요 신호를 계산합니다.' },
  { icon: CheckCircle2, title: '현장 체크 연동', description: '등록 후 임장 체크리스트로 이어집니다.' },
];
