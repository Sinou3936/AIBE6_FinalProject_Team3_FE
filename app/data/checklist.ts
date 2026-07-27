import { FileText, Home, MessageSquare, Shield, Volume2 } from 'lucide-react';
import { type ChecklistCategory } from '../types/domain';

export const checklistCategories: ChecklistCategory[] = [
  { id: 'indoor', name: '실내 상태', icon: Home },
  { id: 'noise', name: '소음·환경', icon: Volume2 },
  { id: 'safety', name: '보안·안전', icon: Shield },
  { id: 'area', name: '주변 환경', icon: MessageSquare },
  // 필수(REQUIRED) 항목이 몰려 있는 카테고리라 마지막에 둔다 — 다음 단계 버튼(ChecklistClient)이
  // 필수 항목 완료 시 뜨는데, 이 탭보다 먼저 끝나버리면 아직 안 본 탭이 남은 채로 버튼이 떠서 어색하다.
  { id: 'documents', name: '서류·행정', icon: FileText },
];
