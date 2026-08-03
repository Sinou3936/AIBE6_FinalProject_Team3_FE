import {
  type ActivityHistoryItem,
  type ChecklistOverview,
  type HomeSummaryCounts,
  type PropertySummary,
} from '../types/domain';

export function computeHomeSummaryCounts(
  properties: PropertySummary[],
  activityHistory: ActivityHistoryItem[],
  checklistOverviews: ChecklistOverview[],
): HomeSummaryCounts {
  return {
    interestedPropertyCount: properties.length,
    signalsToCheckCount: properties.reduce((sum, property) => sum + (property.checkSignalCount ?? 0), 0),
    activeChecklistCount: checklistOverviews.filter((overview) => overview.status === 'IN_PROGRESS').length,
    analyzedSpecialTermsCount: activityHistory.filter((item) => item.type === '특약사항 분석').length,
  };
}
