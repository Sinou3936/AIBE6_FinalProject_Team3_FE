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

// BE PageResponse<T> 그대로 - Spring Data Pageable 기반 목록 조회 응답의 공용 래퍼.
export type PageResponseDto<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
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
  userNote: string | null;
};

export type ChecklistDto = {
  id: number;
  propertyId: number;
  templateVersion: number;
  status: ChecklistStatusDto;
  items: ChecklistItemDto[];
};

// GET /checklists/{checklistId}/result 응답. Backend가 @JsonInclude(NON_NULL)이라
// message는 NOT_STARTED일 때만 오고, 그 외에는 필드 자체가 응답에서 빠진다.
export type ChecklistResultDto = {
  status: ChecklistStatusDto;
  checkedCount: number;
  totalCount: number;
  requiredMissingCount: number;
  issueCount: number;
  message?: string;
};

// PATCH 요청 바디. checked만 바뀌는 CHECK 타입 문항은 { checked }, 값 입력이 필요한 YES_NO/DATE/
// DOCUMENT_REQUEST는 { value }, CHECK 타입을 "미흡"으로 표시(+메모)할 때는 { userNote }만 보낸다.
export type ChecklistItemUpdateRequestDto = { checked: boolean } | { value: string } | { userNote: string };

// GET /checklists 응답 원소 하나. checklistId는 아직 시작 안 한 매물이면 null.
export type ChecklistOverviewDto = {
  propertyId: number;
  checklistId: number | null;
  roadAddress: string | null;
  jibunAddress: string | null;
  propertyType: PropertyTypeDto;
  transactionType: PropertyTransactionTypeDto;
  status: ChecklistStatusDto;
};

// 계약 문구 분석 4단계 파이프라인: 입력 제출 -> OCR -> 마스킹 -> AI 분석.
// 서버는 분석 결과를 포함해 아무 것도 저장하지 않는 정책이라, ID로 이전 단계 상태를 참조하는
// 구조가 아니다 - 각 단계의 응답값을 클라이언트가 들고 있다가 다음 단계 요청에 그대로 실어 보낸다.
export type ContractInputType = 'TEXT' | 'IMAGE';
export type ContractInputNextStep = 'OCR' | 'MASKING';

// 이 요청은 JSON 바디가 아니라 multipart/form-data로 보낸다(TEXT/IMAGE 둘 다). 아래 타입은 각
// 필드가 폼 파트로 무엇을 담는지 문서화하는 용도이고, image는 File이라 여기 타입엔 포함하지 않는다.
export type ContractInputRequestDto = {
  inputType: ContractInputType;
  text?: string;
  propertyId?: number;
};

export type ContractInputResponseDto = {
  inputType: ContractInputType;
  readyForNextStep: boolean;
  nextStep: ContractInputNextStep;
};

// OCR 요청은 JSON 바디가 아니라 multipart/form-data(image 파일)라 별도 request DTO가 없다.
export type OcrExtractResponseDto = {
  extractedText: string;
  confidence: number;
  editable: boolean;
};

export type ContractMaskingRequestDto = {
  text: string;
};

export type ContractMaskingResponseDto = {
  maskedText: string;
  maskedCount: number;
  requiresUserConfirmation: boolean;
};

export type ContractAnalyzeRequestDto = {
  maskedText: string;
  userConfirmed: boolean;
  propertyId?: number;
};

export type ContractClauseDto = {
  originalText: string;
  riskFlag: boolean;
  explanation: string;
  question: string;
  suggestedText: string;
};

export type ContractAnalysisResultDto = {
  clauses: ContractClauseDto[];
  summary: string;
  aiGeneratedNotice: string;
  disclaimer: string;
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

export type PasswordPolicyDto = {
  // <input pattern="..."> 속성값으로 그대로 쓸 수 있는 정규식(앞뒤 ^/$ 없음).
  pattern: string;
  message: string;
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
  // 실제 적용된 반경 단계(300 또는 600). status가 UNAVAILABLE이면 null.
  radiusMeters: number | null;
  // UNAVAILABLE 사유를 사람이 읽을 수 있는 문장으로 내려준다(월세/단독다가구/좌표없음/표본부족 등).
  // AVAILABLE이면 null.
  message: string | null;
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
  // 로그인한 사용자 본인 기준 - 체크리스트를 생성했는지, 본인이 이 매물을 신고한 적 있는지.
  checklistCreated: boolean;
  reported: boolean;
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
