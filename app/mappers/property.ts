import { type PropertySummary } from '../types/domain';
import { type ApiStatusTone, type PropertySummaryDto } from '../types/api';

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
