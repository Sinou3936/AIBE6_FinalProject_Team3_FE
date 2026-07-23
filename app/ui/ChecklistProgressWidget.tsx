import { ListChecks } from 'lucide-react';
import Link from 'next/link';

type ChecklistProgressWidgetProps = {
  checkedCount: number;
  totalCount: number;
  cautionCount: number;
};

export function ChecklistProgressWidget({ checkedCount, totalCount, cautionCount }: ChecklistProgressWidgetProps) {
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <Link href="/checklist" className="ansim-card mb-10 block p-5 transition hover:border-teal-200">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-teal-600" />
          <span className="text-sm font-bold text-slate-950">진행 중인 체크리스트</span>
        </div>
        <span className="text-sm font-medium text-slate-600">
          {checkedCount}/{totalCount} 확인, 주의 {cautionCount}개
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-teal-500" style={{ width: `${progress}%` }} />
      </div>
    </Link>
  );
}
