import { cn } from '../lib/cn';

type InfoRowProps = {
  label: string;
  value: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

export function InfoRow({ label, value, className, labelClassName, valueClassName }: InfoRowProps) {
  return (
    <div className={cn('flex justify-between border-b border-slate-50 py-2 last:border-b-0', className)}>
      <span className={cn('text-sm text-slate-400', labelClassName)}>{label}</span>
      <span className={cn('text-right text-sm font-medium text-slate-950', valueClassName)}>{value}</span>
    </div>
  );
}
