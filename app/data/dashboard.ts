import { CheckCircle2, FileSearch, PlusCircle, ShieldAlert } from 'lucide-react';
import { type QuickAction, type QuickActionTone } from '../types/domain';

export const quickActionToneMap: Record<QuickActionTone, string> = {
  teal: 'bg-teal-100 text-teal-700',
  orange: 'bg-orange-100 text-orange-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
};

export const quickActions: QuickAction[] = [
  {
    to: '/properties/register',
    icon: PlusCircle,
    title: '매물 검증하기',
    description: '주소와 보증금으로 시세 대비 적정성과 확인 필요 신호를 봅니다.',
    tone: 'teal',
  },
  {
    // to는 fallback 기본값일 뿐 실제로는 항상 덮어써진다 - home/page.tsx가
    // app/lib/riskCheckAction.ts의 getRiskCheckHref()로 매물/신호 상태에 따라 동적으로
    // 계산한 href를 이 카드(title === '위험 신호 확인')에 주입한다(#181).
    to: '/properties',
    icon: ShieldAlert,
    title: '위험 신호 확인',
    description: '허위매물 의심 신호와 보증금 안전성 수치를 한 번에 확인합니다.',
    tone: 'orange',
  },
  {
    to: '/checklists',
    icon: CheckCircle2,
    title: '현장 체크리스트',
    description: '매물 유형에 맞춘 방문 확인 항목을 기록합니다.',
    tone: 'emerald',
  },
  {
    to: '/contract/upload',
    icon: FileSearch,
    title: '특약사항 분석',
    description: '계약서 전체가 아닌 특약사항 핵심 문구를 쉽게 풀어봅니다.',
    tone: 'blue',
  },
];
