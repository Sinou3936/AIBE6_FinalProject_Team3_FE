import { type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

type SummaryCardProps = {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: 'default' | 'orange';
  className?: string;
  valueClassName?: string;
};

export function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  className,
  valueClassName,
}: SummaryCardProps) {
  const isOrange = tone === 'orange';

  return (
    <div className={cn('ansim-card p-5', isOrange && 'border-orange-100 bg-orange-50/50', className)}>
      {Icon && <Icon className="mb-3 h-5 w-5 text-teal-600" />}
      <p className={cn('mb-1 text-xs font-bold', isOrange ? 'text-orange-600' : 'text-slate-500')}>{label}</p>
      <p className={cn('text-xl font-bold', isOrange ? 'text-orange-950' : 'text-slate-950', valueClassName)}>
        {value}
      </p>
    </div>
  );
}
