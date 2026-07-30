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
 * 설명/이미지/등록일/실거래가 비교 결과를 포함한다. 신호/전세가율/체크리스트/관리비는
 * 목록과 동일하게 아직 백엔드에 없어 실제 매물은 undefined, mock 데이터만 값을 채운다.
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
  checkSignalCount?: number;
  signalSummary?: string;
  jeonseRatio?: string;
  checklist?: number;
  statusColor: string;
  location: PropertyLocation;
  createdAt?: string;
  // 실거래가 비교(market-data) 결과. 실제 API는 항상 채워진다(status가 AVAILABLE/UNAVAILABLE
  // 둘 중 하나) - "정보 없음"이 아니라 판정 결과 자체가 항상 존재한다는 뜻.
  marketComparison?: PropertyMarketComparison;
};

/**
 * BE MarketComparisonDto를 화면 표시용으로 가공한 형태. status가 UNAVAILABLE이면
 * referencePriceText 등 나머지 필드는 비어있고 message에 사유 문구만 채워진다.
 */
export type PropertyMarketComparison = {
  status: 'AVAILABLE' | 'UNAVAILABLE';
  referencePriceText?: string;
  differenceRateText?: string;
  sampleCount?: number;
  referenceDate?: string;
  // 실제 적용된 반경 단계(300 또는 600) - 반경이 확장됐는지 사용자에게 알려주기 위함.
  radiusMeters?: number;
  // UNAVAILABLE일 때 사유(월세/단독다가구/좌표없음/표본부족 등)를 그대로 보여준다.
  message?: string;
};

export type PropertyRiskSummary = {
  icon: LucideIcon;
  title: string;
  description: string;
  iconBoxClass: string;
  iconClass: string;
};

export type ChecklistCategoryId = 'indoor' | 'noise' | 'safety' | 'documents' | 'area';

export type ChecklistCategory = {
  id: ChecklistCategoryId;
  name: string;
  icon: LucideIcon;
};

export type ChecklistItemType = 'check' | 'yesNo' | 'date' | 'documentRequest';
export type ChecklistImportance = 'required' | 'general';

export type ChecklistItem = {
  id: number;
  category: ChecklistCategoryId;
  content: string;
  guideText: string | null;
  // 질문/guideText를 읽어도 남는 배경지식(용어, 왜 문제가 되는지)을 초등학생도 이해할 수 있게 풀어주는 문구.
  // guideText와 달리 일부 필수 항목에만 존재한다(예: 서비스 내에서 별도로 다루는 항목은 null).
  helperText: string | null;
  importance: ChecklistImportance;
  itemType: ChecklistItemType;
  checked: boolean;
  issueFound: boolean;
  value: string | null;
  userNote: string | null;
};

// Backend의 status(NOT_STARTED/IN_PROGRESS/COMPLETED)는 FE가 items로부터 직접 계산하는
// summary(app/lib/checklistSummary.ts)로 대체되므로 domain 타입엔 보관하지 않는다.
export type Checklist = {
  id: number;
  propertyId: number;
  items: ChecklistItem[];
};

export type ChecklistOverviewStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export type ChecklistOverview = {
  propertyId: number;
  checklistId: number | null;
  address: string;
  propertyTitle: string;
  tradeType: PropertyTradeType;
  status: ChecklistOverviewStatus;
};

export type ContractClause = {
  originalText: string;
  riskFlag: boolean;
  explanation: string;
  question: string;
  suggestedText: string;
  levelLabel: string;
  levelColor: string;
};

export type ContractAnalysisResult = {
  clauses: ContractClause[];
  summary: string;
  aiGeneratedNotice: string;
  disclaimer: string;
};

export type ContractSummaryTone = 'orange' | 'slate';

export type ContractSummaryCard = {
  label: string;
  value: string;
  tone: ContractSummaryTone;
};

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
  hasPassword: boolean;
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
