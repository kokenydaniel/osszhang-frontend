import classNames from 'classnames';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact';
}

export function EmptyState({ icon: Icon, title, description, action, className, variant = 'default' }: EmptyStateProps) {
  if (variant === 'compact') {
    return (
      <p className={classNames('text-xs text-muted-foreground text-center py-4', className)}>
        {title}
      </p>
    );
  }

  return (
    <div
      className={classNames(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-border',
        'bg-muted/30 py-10 px-6 text-center',
        className,
      )}
    >
      {Icon ? (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground">
          <Icon size={20} strokeWidth={1.8} />
        </div>
      ) : null}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
