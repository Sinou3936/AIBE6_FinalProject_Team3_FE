import { type PropertyTradeType } from './domain';

export type ApiErrorBody = {
  code: string;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: ApiErrorBody | null;
};

export type ApiStatusTone = 'orange' | 'emerald' | 'red' | 'slate';

export type PropertySummaryDto = {
  id: number;
  title: string;
  address: string;
  tradeType: PropertyTradeType;
  depositText: string;
  maintenanceText: string;
  marketDelta: string;
  checkSignalCount: number;
  signalSummary: string;
  jeonseRatio: string;
  checklistProgress: number;
  statusTone: ApiStatusTone;
  latitude: number;
  longitude: number;
};

export type ChecklistItemTypeDto = 'CHECK' | 'YES_NO' | 'DATE' | 'DOCUMENT_REQUEST';
export type ChecklistImportanceDto = 'REQUIRED' | 'GENERAL';
export type ChecklistCategoryDto = 'INDOOR' | 'NOISE' | 'SAFETY' | 'DOCUMENTS' | 'AREA';
export type ChecklistStatusDto = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export type ChecklistItemDto = {
  id: number;
  category: ChecklistCategoryDto;
  content: string;
  guideText: string | null;
  importance: ChecklistImportanceDto;
  itemType: ChecklistItemTypeDto;
  checked: boolean;
  issueFound: boolean;
  value: string | null;
};

export type ChecklistDto = {
  id: number;
  propertyId: number;
  templateVersion: number;
  status: ChecklistStatusDto;
  items: ChecklistItemDto[];
};

// PATCH 요청 바디 — Backend가 아직 미구현이라 이 저장소가 제안하는 계약.
// checked만 바뀌는 CHECK 타입 문항은 { checked }, 값 입력이 필요한 나머지 타입은 { value }만 보낸다.
export type ChecklistItemUpdateRequestDto = { checked: boolean } | { value: string };

export type ContractRiskItemDto = {
  id: number;
  original: string;
  severityTone: Extract<ApiStatusTone, 'orange' | 'red'>;
  simple: string;
  why: string;
  question: string;
  suggestion: string;
};

export type ContractInfoItemDto = {
  label: string;
  value: string;
};

export type ActivityHistoryItemDto = {
  title: string;
  type: string;
  date: string;
  status: string;
};

export type MyPageOverviewDto = {
  activityHistory: ActivityHistoryItemDto[];
  bookmarkedProperties: PropertySummaryDto[];
};

export type MeResponseDto = {
  userId: number;
  email: string | null;
  nickname: string;
  profileImageUrl: string | null;
  role: string;
};

export type UserTransactionTypeDto = 'JEONSE' | 'WOLSE';

export type UserProfileDto = {
  id: number;
  email: string | null;
  nickname: string;
  profileImageUrl: string | null;
  status: string;
  interestRegion: string | null;
  transactionType: UserTransactionTypeDto | null;
  currentStage: string | null;
  hasPassword: boolean;
};

export type ProfileUpdateRequestDto = {
  nickname?: string;
  profileImageUrl?: string;
  interestRegion?: string;
  transactionType?: UserTransactionTypeDto;
  currentStage?: string;
};

export type ProfileRegisterRequestDto = {
  nickname?: string;
  interestRegion: string;
  transactionType: UserTransactionTypeDto;
  currentStage?: string;
};

export type NicknameCheckResponseDto = {
  available: boolean;
};

// --- Property CRUD (실제 백엔드 응답 형태. PropertySummaryDto는 아직 없는 기능(신호/전세가율/
// 체크리스트 등)까지 포함한 목업 전용 타입이라 분리해서 둔다) ---

export type PropertyTypeDto = 'OFFICETEL' | 'MULTI_FAMILY' | 'DETACHED_HOUSE';
export type PropertyTransactionTypeDto = 'JEONSE' | 'MONTHLY_RENT';
export type PropertyStatusDto = 'ACTIVE' | 'DELETED';

export type CreatePropertyRequestDto = {
  address: string;
  propertyType: PropertyTypeDto;
  transactionType: PropertyTransactionTypeDto;
  deposit: number;
  monthlyRent?: number | null;
  area: number;
  description?: string | null;
};

export type PropertyAddressDto = {
  roadAddress: string | null;
  jibunAddress: string | null;
  latitude: number;
  longitude: number;
};

export type MarketComparisonDto = {
  status: 'UNAVAILABLE' | 'AVAILABLE';
  referencePrice: number | null;
  differenceRate: number | null;
  sampleCount: number | null;
  referenceDate: string | null;
};

export type CreatePropertyResponseDto = {
  propertyId: number;
  status: PropertyStatusDto;
  address: PropertyAddressDto;
  marketComparison: MarketComparisonDto;
  notice: string | null;
};

export type PropertyListItemDto = {
  propertyId: number;
  propertyType: PropertyTypeDto;
  transactionType: PropertyTransactionTypeDto;
  deposit: number;
  monthlyRent: number | null;
  area: number;
  roadAddress: string | null;
  jibunAddress: string | null;
  status: PropertyStatusDto;
  createdAt: string;
};

export type PropertyDetailAddressDto = {
  roadAddress: string | null;
  jibunAddress: string | null;
  latitude: number | null;
  longitude: number | null;
};

// GET /properties/{id} 응답. 목록과 달리 설명/이미지/전체 주소/시세비교까지 포함한다.
export type PropertyDetailResponseDto = {
  propertyId: number;
  propertyType: PropertyTypeDto;
  transactionType: PropertyTransactionTypeDto;
  deposit: number;
  monthlyRent: number | null;
  area: number;
  description: string | null;
  address: PropertyDetailAddressDto;
  imageUrls: string[];
  marketComparison: MarketComparisonDto;
  status: PropertyStatusDto;
  createdAt: string;
  updatedAt: string;
};

// PATCH /properties/{id} 요청. 주소/매물유형/거래유형은 등록 시 확정값이라 수정 대상에서 제외된다
// (변경하려면 재등록 필요 - BE PropertyUpdateRequest 주석 참고).
export type UpdatePropertyRequestDto = {
  deposit: number;
  monthlyRent?: number | null;
  area: number;
  description?: string | null;
};
