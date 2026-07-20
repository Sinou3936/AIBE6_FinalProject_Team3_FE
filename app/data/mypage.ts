import { CheckCircle2, FileText, Home, ShieldAlert } from 'lucide-react';
import { type FeatureCardData } from '../types/domain';

export const profileSummaryItems: Array<Pick<FeatureCardData, 'icon'> & { label: string; value: string }> = [
  { icon: Home, label: '관심 매물', value: '3개' },
  { icon: ShieldAlert, label: '확인 필요 신호', value: '2개' },
  { icon: CheckCircle2, label: '체크리스트', value: '1개' },
  { icon: FileText, label: '특약사항 분석', value: '1건' },
];
