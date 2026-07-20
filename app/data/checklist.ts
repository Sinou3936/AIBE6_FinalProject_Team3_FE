import { AlertCircle, CheckCircle2, FileText, Home, MessageSquare, Shield, Volume2, XCircle } from 'lucide-react';
import { type ChecklistCategory, type ChecklistStatusOption } from '../types/domain';

export const checklistCategories: ChecklistCategory[] = [
  { id: 'indoor', name: '실내 상태', icon: Home },
  { id: 'noise', name: '소음·환경', icon: Volume2 },
  { id: 'safety', name: '보안·안전', icon: Shield },
  { id: 'documents', name: '서류·행정', icon: FileText },
  { id: 'area', name: '주변 환경', icon: MessageSquare },
];

export const checklistStatusOptions: ChecklistStatusOption[] = [
  { status: 'checked', label: '확인', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-50' },
  { status: 'caution', label: '주의', icon: AlertCircle, className: 'text-orange-600 bg-orange-50' },
  { status: 'problem', label: '문제', icon: XCircle, className: 'text-red-600 bg-red-50' },
];
