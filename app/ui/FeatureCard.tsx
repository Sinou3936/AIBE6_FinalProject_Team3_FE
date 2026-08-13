import { ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName?: string;
  descriptionClassName?: string;
  className?: string;
  onClick?: () => void;
};

export function FeatureCard({
  icon: Icon,
  title,
  description,
  iconClassName,
  descriptionClassName,
  className,
  onClick,
}: FeatureCardProps) {
  const content = (
    <>
      <Icon className={cn('mb-3 h-5 w-5 text-teal-600', iconClassName)} />
      <p className="mb-1 font-bold text-slate-950">{title}</p>
      <p className={cn('text-xs leading-relaxed text-slate-500', descriptionClassName)}>{description}</p>
      {onClick && (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal-700">
          예시 보기 <ArrowRight className="h-3 w-3" />
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn('ansim-card block w-full p-4 text-left transition hover:border-teal-200 hover:shadow-md', className)}
      >
        {content}
      </button>
    );
  }

  return <div className={cn('ansim-card p-4', className)}>{content}</div>;
}
