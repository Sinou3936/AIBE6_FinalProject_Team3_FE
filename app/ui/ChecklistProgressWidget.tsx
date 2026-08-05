import { ListChecks } from 'lucide-react';
import Link from 'next/link';

type ChecklistProgressWidgetProps = {
  propertyTitle: string;
  progressPercent: number;
  cautionCount: number;
  href: string;
};

export function ChecklistProgressWidget({
  propertyTitle,
  progressPercent,
  cautionCount,
  href,
}: ChecklistProgressWidgetProps) {
  return (
    <Link href={href} className="ansim-card block p-5 transition hover:border-teal-200">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-teal-600" />
          <span className="text-sm font-bold text-slate-950">{propertyTitle} 체크리스트</span>
        </div>
        <span className="text-sm font-medium text-slate-600">
          {progressPercent}% 확인, 주의 {cautionCount}개
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-teal-500" style={{ width: `${progressPercent}%` }} />
      </div>
    </Link>
  );
}
