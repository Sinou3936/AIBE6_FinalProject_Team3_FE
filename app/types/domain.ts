import { type LucideIcon } from 'lucide-react';

export type PropertyTradeType = '전세' | '월세' | '반전세';

export type PropertyLocation = {
  latitude: number;
  longitude: number;
};

export type PropertySummary = {
  id: number;
  title: string;
  address: string;
  type: PropertyTradeType;
  deposit: string;
  maintenance: string;
  marketDelta: string;
  checkSignalCount: number;
  signalSummary: string;
  jeonseRatio: string;
  checklist: number;
  statusColor: string;
  location: PropertyLocation;
};

export type PropertyPricePoint = {
  month: string;
  price: number;
};

export type PropertyRiskSummary = {
  icon: LucideIcon;
  title: string;
  description: string;
  iconBoxClass: string;
  iconClass: string;
};

export type ChecklistCategoryId = 'indoor' | 'noise' | 'safety' | 'documents' | 'area';

export type ChecklistStatus = 'checked' | 'caution' | 'problem';

export type ChecklistCategory = {
  id: ChecklistCategoryId;
  name: string;
  icon: LucideIcon;
};

export type ChecklistItem = {
  id: number;
  category: ChecklistCategoryId;
  text: string;
  status: ChecklistStatus | null;
};

export type ChecklistStatusOption = {
  status: ChecklistStatus;
  label: string;
  icon: LucideIcon;
  className: string;
};

export type ContractRiskItem = {
  id: number;
  original: string;
  level: string;
  levelColor: string;
  simple: string;
  why: string;
  question: string;
  suggestion: string;
};

export type ContractSummaryTone = 'orange' | 'slate';

export type ContractSummaryCard = {
  label: string;
  value: string;
  tone: ContractSummaryTone;
};

export type ContractInfoItem = readonly [label: string, value: string];

export type ContractAnalysisTab = 'risk' | 'deposit' | 'missing';

export type ContractTab = {
  key: ContractAnalysisTab;
  label: string;
};

export type ContractMissingItem = {
  title: string;
  description: string;
};

export type QuickActionTone = 'teal' | 'orange' | 'emerald' | 'blue';

export type QuickAction = {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tone: QuickActionTone;
};

export type FeatureCardData = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type TonedFeatureCardData = FeatureCardData & {
  tone: string;
};

export type SummaryItem = readonly [label: string, value: string];

export type NavigationItem = {
  name: string;
  path: string;
  icon: LucideIcon;
};

export type ActivityHistoryItem = {
  title: string;
  type: string;
  date: string;
  status: string;
};

export type MyPageOverview = {
  activityHistory: ActivityHistoryItem[];
  bookmarkedProperties: PropertySummary[];
};

export type UserTransactionType = '전세' | '월세' | '매매';

export type UserProfile = {
  nickname: string;
  profileImageUrl: string | null;
  interestRegion: string | null;
  transactionType: UserTransactionType | null;
  currentStage: string | null;
};

export type ProfileUpdateInput = {
  nickname: string;
  interestRegion: string;
  transactionType: UserTransactionType | null;
  currentStage: string;
};
