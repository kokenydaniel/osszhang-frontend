'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

export type SegmentTone = 'positive' | 'negative' | 'primary' | 'accent';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
  /** Rövid magyarázat a „choice” változatnál. */
  description?: string;
  tone?: SegmentTone;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  layoutId?: string;
  animated?: boolean;
  /** compact = klasszikus csúszka; choice = nagy, színes, két opcióhoz ideális */
  variant?: 'compact' | 'choice';
}

const toneStyles: Record<
  SegmentTone,
  { active: string; icon: string; ring: string }
> = {
  positive: {
    active: 'border-emerald-500/60 bg-emerald-500/[0.08] text-emerald-800 dark:text-emerald-300',
    icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-500/25',
  },
  negative: {
    active: 'border-rose-500/60 bg-rose-500/[0.08] text-rose-800 dark:text-rose-300',
    icon: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    ring: 'ring-rose-500/25',
  },
  primary: {
    active: 'border-primary/60 bg-primary/[0.08] text-foreground',
    icon: 'bg-primary/15 text-primary',
    ring: 'ring-primary/25',
  },
  accent: {
    active: 'border-violet-500/60 bg-violet-500/[0.08] text-violet-900 dark:text-violet-200',
    icon: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    ring: 'ring-violet-500/25',
  },
};

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  layoutId,
  animated = true,
  variant = 'compact',
}: SegmentedControlProps<T>) {
  const autoLayoutId = useId();
  const pillLayoutId = layoutId ?? `segmented-pill${autoLayoutId}`;

  if (variant === 'choice') {
    return (
      <div
        role="tablist"
        className={cn(
          'grid gap-2 w-full',
          options.length <= 2 ? 'grid-cols-2' : 'grid-cols-3',
          className,
        )}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          const Icon = opt.icon;
          const tone = opt.tone ?? 'primary';
          const styles = toneStyles[tone];
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-lg border-2 px-3 py-3.5 text-center transition-all touch-manipulation',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                active
                  ? cn(styles.active, styles.ring, 'shadow-sm')
                  : 'border-border/80 bg-muted/25 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground',
              )}
            >
              {Icon && (
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                    active ? styles.icon : 'bg-muted/60 text-muted-foreground',
                  )}
                >
                  <Icon size={18} strokeWidth={2.2} />
                </span>
              )}
              <span className={cn('text-sm font-semibold leading-tight', active && 'text-inherit')}>
                {opt.label}
              </span>
              {opt.description && (
                <span
                  className={cn(
                    'text-[0.65rem] leading-snug max-w-[11rem]',
                    active ? 'text-inherit/80' : 'text-muted-foreground',
                  )}
                >
                  {opt.description}
                </span>
              )}
              {opt.count !== undefined && (
                <span className="absolute top-2 right-2 rounded-md bg-muted px-1.5 py-px text-[0.65rem] font-semibold tabular-nums">
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={cn(
        'relative inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        const tone = opt.tone;
        const styles = tone ? toneStyles[tone] : null;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium transition-colors touch-manipulation',
              size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-3.5 text-[0.8rem]',
              active
                ? styles
                  ? cn(styles.active, 'border-0 shadow-none')
                  : 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active &&
              (animated ? (
                <motion.span
                  layoutId={pillLayoutId}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  className={cn(
                    'absolute inset-0 rounded-md border border-border bg-card shadow-sm',
                    styles && 'border-transparent bg-card',
                  )}
                />
              ) : (
                <span
                  className={cn(
                    'absolute inset-0 rounded-md border border-border bg-card shadow-sm',
                    styles && cn(styles.active, 'border-2'),
                  )}
                />
              ))}
            {Icon && (
              <Icon
                size={size === 'sm' ? 13 : 14}
                strokeWidth={2.2}
                className={cn('relative shrink-0', active && styles?.icon && 'text-inherit')}
              />
            )}
            <span className="relative">{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={cn(
                  'relative rounded px-1.5 py-px text-[0.65rem] font-semibold tabular-nums',
                  active ? 'bg-muted text-foreground' : 'bg-muted/60 text-muted-foreground',
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
