import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

type NoticeBoxProps = {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
  iconClassName?: string;
};

export function NoticeBox({ icon: Icon, children, className, iconClassName }: NoticeBoxProps) {
  return (
    <div className={cn('rounded-xl bg-slate-100 p-4', className)}>
      <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconClassName)} />
        <span>{children}</span>
      </p>
    </div>
  );
}
