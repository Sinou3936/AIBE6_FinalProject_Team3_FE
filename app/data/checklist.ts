import { FileText, Home, MessageSquare, Shield, Volume2 } from 'lucide-react';
import { type ChecklistCategory } from '../types/domain';

export const checklistCategories: ChecklistCategory[] = [
  { id: 'indoor', name: '실내 상태', icon: Home },
  { id: 'noise', name: '소음·환경', icon: Volume2 },
  { id: 'safety', name: '보안·안전', icon: Shield },
  { id: 'documents', name: '서류·행정', icon: FileText },
  { id: 'area', name: '주변 환경', icon: MessageSquare },
];
