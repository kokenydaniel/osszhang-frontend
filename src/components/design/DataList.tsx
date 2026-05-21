'use client';

import classNames from 'classnames';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface DataListProps {
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
}

export function DataList({ children, className, bordered = true }: DataListProps) {
  return (
    <div
      className={classNames(
        'flex flex-col divide-y divide-border',
        bordered && 'rounded-lg border border-border bg-card overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface DataRowProps {
  icon?: LucideIcon | React.ReactElement;
  iconTone?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  interactive?: boolean;
  highlight?: boolean;
}

const iconToneClass = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-50 text-emerald-700',
  danger: 'bg-rose-50 text-rose-700',
  warning: 'bg-amber-50 text-amber-700',
  info: 'bg-sky-50 text-sky-700',
  neutral: 'bg-muted text-muted-foreground',
};

export function DataRow({
  icon: IconProp,
  iconTone = 'neutral',
  leading,
  title,
  subtitle,
  meta,
  trailing,
  actions,
  onClick,
  className,
  interactive,
  highlight,
}: DataRowProps) {
  const isClickable = !!onClick || interactive;

  let iconNode: React.ReactNode = leading ?? null;
  if (!leading && IconProp) {
    if (React.isValidElement(IconProp)) {
      iconNode = IconProp;
    } else {
      const Icon = IconProp as LucideIcon;
      iconNode = (
        <div className={classNames('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', iconToneClass[iconTone])}>
          <Icon size={14} strokeWidth={2} />
        </div>
      );
    }
  }

  return (
    <div
      onClick={onClick}
      className={classNames(
        'flex items-center gap-3 px-4 py-3 transition-colors min-w-0',
        isClickable && 'cursor-pointer hover:bg-muted/40',
        highlight && 'bg-primary/[0.04]',
        className,
      )}
    >
      {iconNode}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</div>}
      </div>
      {meta && <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 text-xs text-muted-foreground">{meta}</div>}
      {trailing && <div className="shrink-0 text-right">{trailing}</div>}
      {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
    </div>
  );
}

interface DataListSectionProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Tooltip a szekció cím mellett */
  info?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function Section({ title, description, info, action, children, className, delay = 0 }: DataListSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      className={classNames('flex flex-col gap-3', className)}
    >
      {(title || action) && (
        <div className="flex items-end justify-between gap-3 px-1">
          <div className="min-w-0">
            {title && (
              <h2 className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
                {info && <InfoTooltip content={info} />}
              </h2>
            )}
            {description && (
              <p className="text-xs text-muted-foreground/80 mt-0.5">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </motion.section>
  );
}
