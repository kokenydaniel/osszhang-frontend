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

const columnGridClass: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 lg:grid-cols-4',
  5: 'grid-cols-1 lg:grid-cols-5',
};

function MetricLabelRow({
  icon: Icon,
  iconClass,
  label,
  info,
}: {
  icon?: LucideIcon;
  iconClass: string;
  label: string;
  info?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-1.5 min-w-0">
      {Icon && (
        <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md', iconClass)}>
          <Icon size={13} strokeWidth={2.2} />
        </div>
      )}
      <div className="min-w-0 flex-1 flex items-start gap-1">
        <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground leading-snug break-words">
          {label}
        </span>
        {info && <InfoTooltip content={info} className="mt-px shrink-0" />}
      </div>
    </div>
  );
}

function MetricLabelRowCompact({
  icon: Icon,
  iconClass,
  label,
  info,
}: {
  icon?: LucideIcon;
  iconClass: string;
  label: string;
  info?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-1.5 min-w-0">
      {Icon && (
        <div className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md', iconClass)}>
          <Icon size={11} strokeWidth={2.2} />
        </div>
      )}
      <div className="min-w-0 flex-1 flex items-start gap-1">
        <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground leading-snug break-words">
          {label}
        </span>
        {info && <InfoTooltip content={info} className="mt-px shrink-0" />}
      </div>
    </div>
  );
}
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
          columnGridClass[cols] ?? 'grid-cols-1',
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
              <div
                className={cn(
                  'mb-3 flex flex-col gap-3 min-w-0',
                  m.action ? 'lg:flex-row lg:items-start lg:justify-between lg:gap-3' : '',
                )}
              >
                <MetricLabelRow icon={Icon} iconClass={t.icon} label={m.label} info={m.info} />
                {m.action ? (
                  <div className="hidden lg:block shrink-0">{m.action}</div>
                ) : null}
              </div>
              <div className="flex items-end justify-between gap-2 min-w-0">
                <div className={cn('min-w-0 text-xl sm:text-[1.5rem] font-semibold tabular-nums tracking-tight leading-none', t.value)}>
                  {m.value}
                </div>
                {m.sparkline && m.sparkline.length > 1 && (
                  <Sparkline values={m.sparkline} stroke={t.sparkStroke} fill={t.sparkFill} height={28} width={70} />
                )}
              </div>
              {(m.hint || m.trend) && (
                <div className="flex flex-wrap items-start gap-x-1.5 gap-y-1 text-xs text-muted-foreground mt-2 min-w-0">
                  {TrendIcon && (
                    <span className={cn('inline-flex shrink-0 items-center gap-0.5 font-medium px-1.5 py-0.5 rounded text-[0.65rem]', trendToneMap[m.trend!])}>
                      <TrendIcon size={10} strokeWidth={2.5} />
                      {m.trendValue}
                    </span>
                  )}
                  {m.hint && <span className="min-w-0 break-words leading-snug">{m.hint}</span>}
                </div>
              )}
              {m.action ? <div className="mt-3 lg:hidden">{m.action}</div> : null}
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
        columnGridClass[cols] ?? 'grid-cols-1',
        cols >= 4 ? '[&>*:not(:last-child)]:border-b lg:[&>*:not(:last-child)]:border-b-0' : '[&>*:nth-child(-n+2)]:border-b sm:[&>*:nth-child(-n+2)]:border-b-0',
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
            className={cn(
              'relative flex flex-col gap-2 px-4 py-4 min-w-0 group hover:bg-muted/30 transition-colors',
              t.bg,
            )}
          >
            <span className={cn('absolute inset-y-0 left-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity', t.bar)} />
            <div
              className={cn(
                'flex flex-col gap-2 min-w-0',
                m.action ? 'lg:flex-row lg:items-start lg:justify-between lg:gap-3' : '',
              )}
            >
              <MetricLabelRowCompact icon={Icon} iconClass={t.icon} label={m.label} info={m.info} />
              {m.action ? (
                <div className="hidden lg:block shrink-0">{m.action}</div>
              ) : null}
            </div>
            <div className="flex items-end justify-between gap-2 min-w-0">
              <div className={cn('min-w-0 text-lg sm:text-xl md:text-[1.4rem] font-semibold tabular-nums tracking-tight leading-none', t.value)}>
                {m.value}
              </div>
              {m.sparkline && m.sparkline.length > 1 && (
                <Sparkline values={m.sparkline} stroke={t.sparkStroke} fill={t.sparkFill} height={22} width={56} />
              )}
            </div>
            {(m.hint || m.trend) && (
              <div className="flex flex-wrap items-start gap-x-1.5 gap-y-1 text-xs text-muted-foreground min-h-[1rem] min-w-0">
                {TrendIcon && (
                  <span className={cn('inline-flex shrink-0 items-center gap-0.5 font-medium px-1.5 py-0.5 rounded text-[0.65rem]', trendToneMap[m.trend!])}>
                    <TrendIcon size={10} strokeWidth={2.5} />
                    {m.trendValue}
                  </span>
                )}
                {m.hint && <span className="min-w-0 break-words leading-snug">{m.hint}</span>}
              </div>
            )}
            {m.action ? <div className="mt-1 lg:hidden">{m.action}</div> : null}
          </motion.div>
        );
      })}
    </div>
  );
}
