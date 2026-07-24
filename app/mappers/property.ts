import { type PropertyTradeType, type PropertySummary } from '../types/domain';
import {
  type ApiStatusTone,
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

const propertyTypeLabelMap: Record<PropertyTypeDto, string> = {
  OFFICETEL: '오피스텔',
  MULTI_FAMILY: '연립다세대',
  DETACHED_HOUSE: '단독/다가구',
};

const propertyTransactionTypeLabelMap: Record<PropertyTransactionTypeDto, PropertyTradeType> = {
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
