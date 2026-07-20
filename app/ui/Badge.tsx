import { type ReactNode } from 'react';
import { cn } from '../lib/cn';

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', className)}>{children}</span>;
}
