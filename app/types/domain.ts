import { type LucideIcon } from 'lucide-react';

// 서비스 대상 거래유형은 전세/월세만 지원한다 (반전세/매매는 스코프 밖 — 기획서 "대상 범위" 참고).
export type PropertyTradeType = '전세' | '월세';

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
  // 아래 필드들은 기능4(허위매물 신호)/기능5(전세가율)/기능2(체크리스트)가 아직 백엔드에 없어서
  // 실제 API로 받아온 매물은 undefined다. mock 데이터는 계속 값을 채워서 내려준다.
  maintenance?: string;
  marketDelta?: string;
  checkSignalCount?: number;
  signalSummary?: string;
  jeonseRatio?: string;
  checklist?: number;
  statusColor: string;
  location: PropertyLocation;
};

/**
 * 매물 상세(GET /properties/{id}) 화면 전용 도메인 타입. PropertySummary(목록)와 달리
 * 설명/이미지/등록일을 포함한다. 신호/전세가율/체크리스트/관리비/시세차이는 목록과 동일하게
 * 아직 백엔드에 없어 실제 매물은 undefined, mock 데이터만 값을 채운다.
 */
export type PropertyDetail = {
  id: number;
  title: string;
  type: PropertyTradeType;
  address: string;
  deposit: string;
  // 수정 폼 입력값 프리필용 원시 금액(원 단위). 실제 API는 항상 채워지고, mock은 표시용 문자열만
  // 갖고 있어 원본 금액을 복원할 수 없으므로 undefined로 둔다(수정 화면은 실제 API 기준으로 검증).
  depositAmount?: number;
  monthlyRentAmount?: number | null;
  area?: number;
  description?: string;
  imageUrls: string[];
  maintenance?: string;
  marketDelta?: string;
  checkSignalCount?: number;
  signalSummary?: string;
  jeonseRatio?: string;
  checklist?: number;
  statusColor: string;
  location: PropertyLocation;
  createdAt?: string;
  // 실거래가 기간별 추이 차트용. 국토부 실거래가 연동 전까지 실제 매물은 항상 undefined이고,
  // mock 데이터에서만 데모용 값을 채운다.
  priceHistory?: PropertyPricePoint[];
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

export type UserTransactionType = '전세' | '월세';

export type UserCurrentStage = '자취 처음' | '자취 경험 있음';

export type UserProfile = {
  nickname: string;
  profileImageUrl: string | null;
  interestRegion: string | null;
  transactionType: UserTransactionType | null;
  currentStage: UserCurrentStage | null;
};

export type ProfileUpdateInput = {
  nickname: string;
  profileImageUrl: string;
  interestRegion: string;
  transactionType: UserTransactionType | null;
  currentStage: UserCurrentStage | null;
};

export type HomeSummaryCounts = {
  interestedPropertyCount: number;
  signalsToCheckCount: number;
  activeChecklistCount: number;
  analyzedSpecialTermsCount: number;
};

export type PriorityAction = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};
