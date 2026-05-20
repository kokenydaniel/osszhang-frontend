'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

export interface MetricItem {
  label: string;
  value: React.ReactNode;
  /** Tooltip a kártya címke mellett — mit jelent ez a mutató */
  info?: React.ReactNode;
  hint?: React.ReactNode;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  tone?: 'default' | 'success' | 'danger' | 'warning' | 'primary' | 'info';
  icon?: LucideIcon;
  action?: React.ReactNode;
  sparkline?: number[];
  emphasis?: boolean;
}

interface MetricStripProps {
  items: MetricItem[];
  columns?: 2 | 3 | 4 | 5;
  className?: string;
  variant?: 'unified' | 'separated';
}

const toneClass: Record<NonNullable<MetricItem['tone']>, { value: string; icon: string; bg: string; bar: string; sparkStroke: string; sparkFill: string }> = {
  default: {
    value: 'text-foreground',
    icon: 'text-muted-foreground bg-muted/70',
    bg: '',
    bar: 'bg-foreground/15',
    sparkStroke: 'oklch(0.50 0.012 260)',
    sparkFill: 'oklch(0.50 0.012 260 / 0.18)',
  },
  primary: {
    value: 'text-foreground',
    icon: 'text-primary bg-primary/10',
    bg: 'bg-gradient-to-br from-primary/[0.06] to-transparent',
    bar: 'bg-primary',
    sparkStroke: 'oklch(0.56 0.24 275)',
    sparkFill: 'oklch(0.56 0.24 275 / 0.22)',
  },
  success: {
    value: 'text-emerald-600',
    icon: 'text-emerald-600 bg-emerald-100/80',
    bg: 'bg-gradient-to-br from-emerald-50/60 to-transparent',
    bar: 'bg-emerald-500',
    sparkStroke: 'oklch(0.65 0.18 150)',
    sparkFill: 'oklch(0.65 0.18 150 / 0.22)',
  },
  danger: {
    value: 'text-rose-600',
    icon: 'text-rose-600 bg-rose-100/80',
    bg: 'bg-gradient-to-br from-rose-50/60 to-transparent',
    bar: 'bg-rose-500',
    sparkStroke: 'oklch(0.62 0.22 25)',
    sparkFill: 'oklch(0.62 0.22 25 / 0.22)',
  },
  warning: {
    value: 'text-amber-600',
    icon: 'text-amber-700 bg-amber-100/80',
    bg: 'bg-gradient-to-br from-amber-50/60 to-transparent',
    bar: 'bg-amber-500',
    sparkStroke: 'oklch(0.72 0.16 60)',
    sparkFill: 'oklch(0.72 0.16 60 / 0.22)',
  },
  info: {
    value: 'text-sky-700',
    icon: 'text-sky-700 bg-sky-100/80',
    bg: 'bg-gradient-to-br from-sky-50/60 to-transparent',
    bar: 'bg-sky-500',
    sparkStroke: 'oklch(0.62 0.16 200)',
    sparkFill: 'oklch(0.62 0.16 200 / 0.22)',
  },
};

const trendIconMap = { up: TrendingUp, down: TrendingDown, flat: Minus };
const trendToneMap = { up: 'text-emerald-600 bg-emerald-50', down: 'text-rose-600 bg-rose-50', flat: 'text-muted-foreground bg-muted/60' };

export function MetricStrip({ items, columns = 4, className, variant = 'unified' }: MetricStripProps) {
  if (!items.length) return null;
  const cols = Math.min(columns, items.length);

  if (variant === 'separated') {
    return (
      <div
        className={cn(
          'grid gap-3',
          cols === 2 && 'grid-cols-1 sm:grid-cols-2',
          cols === 3 && 'grid-cols-1 sm:grid-cols-3',
          cols === 4 && 'grid-cols-2 lg:grid-cols-4',
          cols === 5 && 'grid-cols-2 lg:grid-cols-5',
          className,
        )}
      >
        {items.map((m, i) => {
          const t = toneClass[m.tone || 'default'];
          const Icon = m.icon;
          const TrendIcon = m.trend ? trendIconMap[m.trend] : null;
          return (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: i * 0.02, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'group relative overflow-hidden rounded-lg border border-border bg-card p-4 shadow-soft hover:shadow-lift transition-shadow',
                t.bg,
              )}
            >
              <span className={cn('absolute inset-x-0 top-0 h-[2px]', t.bar)} />
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  {Icon && (
                    <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', t.icon)}>
                      <Icon size={13} strokeWidth={2.2} />
                    </div>
                  )}
                  <span className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground truncate">
                    {m.label}
                  </span>
                  {m.info && <InfoTooltip content={m.info} />}
                </div>
                {m.action}
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className={cn('text-[1.5rem] font-semibold tabular-nums tracking-tight leading-none', t.value)}>
                  {m.value}
                </div>
                {m.sparkline && m.sparkline.length > 1 && (
                  <Sparkline values={m.sparkline} stroke={t.sparkStroke} fill={t.sparkFill} height={28} width={70} />
                )}
              </div>
              {(m.hint || m.trend) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  {TrendIcon && (
                    <span className={cn('inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded text-[0.65rem]', trendToneMap[m.trend!])}>
                      <TrendIcon size={10} strokeWidth={2.5} />
                      {m.trendValue}
                    </span>
                  )}
                  {m.hint && <span className="truncate">{m.hint}</span>}
                </div>
              )}
            </motion.article>
          );
        })}
      </div>
    );
  }

  // Unified: single bordered container with vertical dividers
  return (
    <div
      className={cn(
        'grid rounded-lg border border-border bg-card overflow-hidden shadow-soft divide-x divide-border',
        cols === 2 && 'grid-cols-1 sm:grid-cols-2',
        cols === 3 && 'grid-cols-1 sm:grid-cols-3',
        cols === 4 && 'grid-cols-2 lg:grid-cols-4',
        cols === 5 && 'grid-cols-2 lg:grid-cols-5',
        '[&>*:nth-child(-n+2)]:border-b sm:[&>*:nth-child(-n+2)]:border-b-0',
        className,
      )}
    >
      {items.map((m, i) => {
        const t = toneClass[m.tone || 'default'];
        const Icon = m.icon;
        const TrendIcon = m.trend ? trendIconMap[m.trend] : null;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            className={cn('relative flex flex-col gap-2 px-4 py-4 min-w-0 group hover:bg-muted/30 transition-colors', t.bg)}
          >
            <span className={cn('absolute inset-y-0 left-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity', t.bar)} />
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {Icon && (
                  <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md', t.icon)}>
                    <Icon size={11} strokeWidth={2.2} />
                  </div>
                )}
                <span className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground truncate">
                  {m.label}
                </span>
                {m.info && <InfoTooltip content={m.info} />}
              </div>
              {m.action}
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className={cn('text-xl md:text-[1.4rem] font-semibold tabular-nums tracking-tight leading-none', t.value)}>
                {m.value}
              </div>
              {m.sparkline && m.sparkline.length > 1 && (
                <Sparkline values={m.sparkline} stroke={t.sparkStroke} fill={t.sparkFill} height={22} width={56} />
              )}
            </div>
            {(m.hint || m.trend) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-h-[1rem]">
                {TrendIcon && (
                  <span className={cn('inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded text-[0.65rem]', trendToneMap[m.trend!])}>
                    <TrendIcon size={10} strokeWidth={2.5} />
                    {m.trendValue}
                  </span>
                )}
                {m.hint && <span className="truncate">{m.hint}</span>}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
