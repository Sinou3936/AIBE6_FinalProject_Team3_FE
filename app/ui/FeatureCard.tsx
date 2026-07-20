import { type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName?: string;
  descriptionClassName?: string;
  className?: string;
};

export function FeatureCard({
  icon: Icon,
  title,
  description,
  iconClassName,
  descriptionClassName,
  className,
}: FeatureCardProps) {
  return (
    <div className={cn('ansim-card p-4', className)}>
      <Icon className={cn('mb-3 h-5 w-5 text-teal-600', iconClassName)} />
      <p className="mb-1 font-bold text-slate-950">{title}</p>
      <p className={cn('text-xs leading-relaxed text-slate-500', descriptionClassName)}>{description}</p>
    </div>
  );
}
