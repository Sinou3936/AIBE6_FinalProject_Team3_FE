import { type ChecklistCategoryId, type ChecklistStatus, type PropertyTradeType } from './domain';

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

export type ChecklistItemDto = {
  id: number;
  category: ChecklistCategoryId;
  text: string;
  status: ChecklistStatus | null;
};

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

// POST /properties/{id}/reports. 마켓플레이스식 "타인 매물 신고"가 아니라 본인이 등록한 매물을
// 본인이 직접 신고하는 자가 플래그 - ETC 선택 시에만 detail이 필수(그 외에는 서버가 null로 강제).
export type PropertyReportReasonDto = 'ALREADY_CONTRACTED' | 'PRICE_MISMATCH' | 'INFO_MISMATCH' | 'DUPLICATE' | 'ETC';

export type ReportPropertyRequestDto = {
  reason: PropertyReportReasonDto;
  detail?: string | null;
};

export type PropertyReportResponseDto = {
  reportId: number;
  propertyId: number;
  reason: PropertyReportReasonDto;
  detail: string | null;
  status: string;
  createdAt: string;
};
