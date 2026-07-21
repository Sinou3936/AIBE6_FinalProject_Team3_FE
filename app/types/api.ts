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
  role: string;
};

export type UserTransactionTypeDto = 'JEONSE' | 'WOLSE' | 'MAEMAE';

export type UserProfileDto = {
  id: number;
  email: string | null;
  nickname: string;
  profileImageUrl: string | null;
  status: string;
  interestRegion: string | null;
  transactionType: UserTransactionTypeDto | null;
  currentStage: string | null;
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
