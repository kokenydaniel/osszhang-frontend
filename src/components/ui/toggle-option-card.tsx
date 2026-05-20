'use client';

import type { LucideIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface ToggleOptionCardProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: LucideIcon;
  title: string;
  description?: string;
  iconClassName?: string;
  activeClassName?: string;
  disabled?: boolean;
}

export function ToggleOptionCard({
  checked,
  onCheckedChange,
  icon: Icon,
  title,
  description,
  iconClassName,
  activeClassName,
  disabled,
}: ToggleOptionCardProps) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={checked}
      aria-disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCheckedChange(!checked);
        }
      }}
      className={cn(
        'flex w-full cursor-pointer gap-3 rounded-xl border p-3.5 text-left transition-all outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary/30',
        disabled && 'cursor-not-allowed opacity-50',
        checked
          ? cn('border-primary/30 bg-primary/5 shadow-sm ring-1 ring-primary/10', activeClassName)
          : 'border-border bg-muted/15 hover:border-border/80 hover:bg-muted/25',
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm transition-colors',
          checked
            ? iconClassName ?? 'bg-primary/15 text-primary'
            : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-semibold text-foreground leading-snug">{title}</p>
        {description ? (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        ) : null}
      </div>
      <div className="flex h-10 shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
        <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      </div>
    </div>
  );
}
