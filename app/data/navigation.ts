import { CheckSquare, FileText, Home, Search } from 'lucide-react';
import { type NavigationItem } from '../types/domain';

export const navItems: NavigationItem[] = [
  { name: '홈', path: '/home', icon: Home },
  { name: '매물 검증', path: '/properties', icon: Search },
  { name: '현장 체크', path: '/checklist', icon: CheckSquare },
  { name: '특약사항 분석', path: '/contract/upload', icon: FileText },
];
