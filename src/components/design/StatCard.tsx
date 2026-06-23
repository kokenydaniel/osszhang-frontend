'use client';

import classNames from 'classnames';
import type { LucideIcon } from 'lucide-react';
import { IconPod, type IconPodTone } from './IconPod';
import { metricLabelClassName } from './metric-label';
import { motion } from 'motion/react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface StatCardProps {
  label: string;
  value: string;
  info?: React.ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: IconPodTone;
  variant?: 'default' | 'danger' | 'success';
  className?: string;
  delay?: number;
}

const variantValueClass: Record<NonNullable<StatCardProps['variant']>, string> = {
  default: 'text-foreground',
  danger: 'text-rose-600',
  success: 'text-emerald-600',
};

export function StatCard({
  label,
  value,
  info,
  hint,
  icon,
  tone = 'primary',
  variant = 'default',
  className,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className={classNames(
        'relative rounded-lg border border-border bg-card p-5 shadow-sm transition-colors',
        'hover:border-foreground/15',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <IconPod icon={icon} tone={tone} size="sm" />
        <span className={metricLabelClassName('inline-flex', 'items-center', 'gap-1')}>
          {label}
          {info && <InfoTooltip content={info} />}
        </span>
      </div>
      <p className={classNames('mt-3 text-2xl font-semibold tabular-nums tracking-tight leading-none', variantValueClass[variant])}>
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </motion.article>
  );
}
