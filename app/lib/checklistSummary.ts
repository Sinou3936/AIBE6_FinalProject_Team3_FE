export type ChecklistSummary = {
  progressPercent: number;
  missingRequiredCount: number;
  cautionCount: number;
  hasStarted: boolean;
  message?: string;
  disclaimer?: string;
};
