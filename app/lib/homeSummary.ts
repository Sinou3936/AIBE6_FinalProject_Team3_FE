import { type ActivityHistoryItem, type HomeSummaryCounts, type PropertySummary } from '../types/domain';

export function computeHomeSummaryCounts(
  properties: PropertySummary[],
  activityHistory: ActivityHistoryItem[],
): HomeSummaryCounts {
  return {
    interestedPropertyCount: properties.length,
    signalsToCheckCount: properties.reduce((sum, property) => sum + (property.checkSignalCount ?? 0), 0),
    activeChecklistCount: properties.filter(
      (property) => (property.checklist ?? 0) > 0 && (property.checklist ?? 0) < 100,
    ).length,
    analyzedSpecialTermsCount: activityHistory.filter((item) => item.type === '특약사항 분석').length,
  };
}
