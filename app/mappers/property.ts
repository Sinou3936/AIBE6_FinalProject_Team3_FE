import {
  type PropertyDetail,
  type PropertyMarketComparison,
  type PropertyTradeType,
  type PropertySummary,
} from '../types/domain';
import {
  type ApiStatusTone,
  type MarketComparisonDto,
  type PropertyDetailResponseDto,
  type PropertyListItemDto,
  type PropertySummaryDto,
  type PropertyTransactionTypeDto,
  type PropertyTypeDto,
} from '../types/api';

const propertyStatusColorMap: Record<ApiStatusTone, string> = {
  orange: 'bg-orange-100 text-orange-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  slate: 'bg-slate-100 text-slate-600',
};

export function mapPropertySummaryDto(dto: PropertySummaryDto): PropertySummary {
  return {
    id: dto.id,
    title: dto.title,
    address: dto.address,
    type: dto.tradeType,
    deposit: dto.depositText,
    maintenance: dto.maintenanceText,
    marketDelta: dto.marketDelta,
    checkSignalCount: dto.checkSignalCount,
    signalSummary: dto.signalSummary,
    jeonseRatio: dto.jeonseRatio,
    checklist: dto.checklistProgress,
    statusColor: propertyStatusColorMap[dto.statusTone],
    location: {
      latitude: dto.latitude,
      longitude: dto.longitude,
    },
  };
}

export const propertyTypeLabelMap: Record<PropertyTypeDto, string> = {
  OFFICETEL: '오피스텔',
  MULTI_FAMILY: '연립다세대',
  DETACHED_HOUSE: '단독/다가구',
};

export const propertyTransactionTypeLabelMap: Record<PropertyTransactionTypeDto, PropertyTradeType> = {
  JEONSE: '전세',
  MONTHLY_RENT: '월세',
};

// 백엔드는 원(KRW) 단위 정수를 그대로 내려주고, 화면에는 만원 단위 한글 표기로 보여준다
// (mock 데이터의 depositText 표기 스타일과 맞춤: "1억 8,000만원", "보증금 1,000 / 월세 55").
function formatManwon(amountWon: number): string {
  const manwon = Math.round(amountWon / 10_000);
  const eok = Math.floor(manwon / 10_000);
  const remainder = manwon % 10_000;

  if (eok > 0) {
    return remainder > 0 ? `${eok}억 ${remainder.toLocaleString()}만원` : `${eok}억원`;
  }

  return `${manwon.toLocaleString()}만원`;
}

function formatDepositText(
  transactionType: PropertyTransactionTypeDto,
  deposit: number,
  monthlyRent: number | null,
): string {
  if (transactionType === 'MONTHLY_RENT' && monthlyRent) {
    const depositManwon = Math.round(deposit / 10_000);
    const rentManwon = Math.round(monthlyRent / 10_000);
    return `보증금 ${depositManwon.toLocaleString()} / 월세 ${rentManwon.toLocaleString()}`;
  }

  return formatManwon(deposit);
}

/**
 * 실제 GET /properties 응답(PropertyListItemDto) -> PropertySummary 변환.
 * 기능4(허위매물 신호)/기능5(전세가율)/기능2(체크리스트)/관리비는 아직 백엔드에 없어서
 * 의도적으로 채우지 않는다 (undefined) - 화면(PropertiesClient)에서 조건부로 처리한다.
 * location도 목록 응답엔 좌표가 없어 0,0으로 채우는데, 목록 카드에서는 좌표를 쓰지 않는다.
 */
export function mapPropertyListItemDto(dto: PropertyListItemDto): PropertySummary {
  return {
    id: dto.propertyId,
    title: `${propertyTypeLabelMap[dto.propertyType]} 매물`,
    address: dto.roadAddress ?? dto.jibunAddress ?? '주소 정보 없음',
    type: propertyTransactionTypeLabelMap[dto.transactionType],
    deposit: formatDepositText(dto.transactionType, dto.deposit, dto.monthlyRent),
    statusColor: propertyStatusColorMap.slate,
    location: { latitude: 0, longitude: 0 },
  };
}

// "2026-07-24T10:26:13.9" -> "2026.07.24"
function formatDateText(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) {
    return isoDateTime;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function formatMarketDelta(differenceRate: number): string {
  const percent = Math.round(differenceRate * 100);
  return percent >= 0 ? `+${percent}%` : `${percent}%`;
}

/**
 * BE MarketComparisonDto -> 화면 표시용 PropertyMarketComparison 변환. status와 무관하게
 * 항상 객체를 만든다 - UNAVAILABLE이어도 사유(message)를 보여줘야 하기 때문에 "값이 없으면
 * undefined"가 아니라 "값이 있고 status로 분기"가 맞는 형태다.
 */
function mapMarketComparisonDto(dto: MarketComparisonDto): PropertyMarketComparison {
  return {
    status: dto.status,
    referencePriceText: dto.referencePrice !== null ? formatManwon(dto.referencePrice) : undefined,
    differenceRateText: dto.differenceRate !== null ? formatMarketDelta(dto.differenceRate) : undefined,
    sampleCount: dto.sampleCount ?? undefined,
    referenceDate: dto.referenceDate ? formatDateText(dto.referenceDate) : undefined,
    radiusMeters: dto.radiusMeters ?? undefined,
    message: dto.message ?? undefined,
  };
}

/**
 * 실제 GET /properties/{id} 응답(PropertyDetailResponseDto) -> PropertyDetail 변환.
 * marketComparison은 BE의 실거래가 비교 로직이 실제로 계산한 결과(AVAILABLE/UNAVAILABLE)를
 * 그대로 옮겨 담는다. 신호(기능4)/전세가율(기능5)/체크리스트(기능2)/관리비는 아직 API 자체가
 * 없어 항상 undefined.
 */
export function mapPropertyDetailResponseDto(dto: PropertyDetailResponseDto): PropertyDetail {
  return {
    id: dto.propertyId,
    title: `${propertyTypeLabelMap[dto.propertyType]} 매물`,
    address: dto.address.roadAddress ?? dto.address.jibunAddress ?? '주소 정보 없음',
    type: propertyTransactionTypeLabelMap[dto.transactionType],
    deposit: formatDepositText(dto.transactionType, dto.deposit, dto.monthlyRent),
    depositAmount: dto.deposit,
    monthlyRentAmount: dto.monthlyRent,
    area: dto.area,
    description: dto.description ?? undefined,
    imageUrls: dto.imageUrls,
    marketComparison: mapMarketComparisonDto(dto.marketComparison),
    statusColor: propertyStatusColorMap.slate,
    location: {
      latitude: dto.address.latitude ?? 0,
      longitude: dto.address.longitude ?? 0,
    },
    createdAt: formatDateText(dto.createdAt),
  };
}

const detailMockImageUrls = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=500',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=500',
];

/**
 * mock 저장소는 PropertySummary(목록과 동일한 목업 타입)까지만 가지고 있어, 상세 화면 전용
 * 필드(설명/이미지/등록일)는 실제 API가 없으니 데모용 값으로 채워 PropertyDetail 형태로 맞춘다.
 * DTO를 다시 파싱하는 매퍼가 아니라 목업 호환용 어댑터라는 점에서 위 함수들과 성격이 다르다.
 */
export function mapPropertySummaryToMockDetail(property: PropertySummary): PropertyDetail {
  return {
    ...property,
    imageUrls: detailMockImageUrls,
    description: '깨끗하고 채광이 좋은 매물입니다. 역과 가까워 통근이 편리해요.',
    marketComparison: {
      status: 'AVAILABLE',
      referencePriceText: '1억 8,000만원',
      differenceRateText: '+3%',
      sampleCount: 5,
      referenceDate: '2026.06.20',
      radiusMeters: 300,
    },
  };
}
