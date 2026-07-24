import { type ChecklistItem } from '../types/domain';

export type ChecklistSummary = {
  progressPercent: number;
  missingRequiredCount: number;
  cautionCount: number;
  hasStarted: boolean;
};

export function calculateChecklistSummary(items: ChecklistItem[]): ChecklistSummary {
  const checkedCount = items.filter((item) => item.checked).length;
  const missingRequiredCount = items.filter((item) => item.importance === 'required' && !item.checked).length;
  const cautionCount = items.filter((item) => item.issueFound).length;
  const progressPercent = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  return { progressPercent, missingRequiredCount, cautionCount, hasStarted: checkedCount > 0 };
}
