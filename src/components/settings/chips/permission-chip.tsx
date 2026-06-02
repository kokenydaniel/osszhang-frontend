'use client';

import type { LucideIcon } from 'lucide-react';
import classNames from 'classnames';

export function PermissionChip({
  label,
  icon: Icon,
  active,
  disabled,
  pending,
  onClick,
  title,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  disabled?: boolean;
  pending?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={onClick}
      title={title}
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.8rem] font-medium transition-colors duration-100 touch-manipulation',
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground',
        !disabled && !pending && !active && 'hover:border-foreground/25 hover:bg-muted/40 hover:text-foreground cursor-pointer',
        disabled && 'cursor-default opacity-80',
        pending && 'opacity-60 pointer-events-none',
      )}
    >
      <Icon size={12} strokeWidth={2.4} />
      {label}
    </button>
  );
}
