'use client';

import classNames from 'classnames';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

type InsightTone = 'info' | 'success' | 'warning' | 'danger' | 'ai';

interface InsightBannerProps {
  tone?: InsightTone;
  icon?: LucideIcon;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const toneStyles: Record<InsightTone, { container: string; icon: string; title: string }> = {
  info: {
    container: 'border-sky-200/70 bg-sky-50/50',
    icon: 'text-sky-700 bg-sky-100/70',
    title: 'text-sky-900',
  },
  success: {
    container: 'border-emerald-200/70 bg-emerald-50/50',
    icon: 'text-emerald-700 bg-emerald-100/70',
    title: 'text-emerald-900',
  },
  warning: {
    container: 'border-amber-200/70 bg-amber-50/50',
    icon: 'text-amber-700 bg-amber-100/70',
    title: 'text-amber-900',
  },
  danger: {
    container: 'border-rose-200/70 bg-rose-50/50',
    icon: 'text-rose-700 bg-rose-100/70',
    title: 'text-rose-900',
  },
  ai: {
    container: 'border-primary/20 bg-primary/[0.04]',
    icon: 'text-primary bg-primary/10',
    title: 'text-foreground',
  },
};

export function InsightBanner({ tone = 'info', icon: Icon, title, children, action, className }: InsightBannerProps) {
  const styles = toneStyles[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={classNames(
        'flex items-start gap-3 rounded-lg border px-4 py-3',
        styles.container,
        className,
      )}
    >
      {Icon && (
        <div className={classNames('flex h-7 w-7 shrink-0 items-center justify-center rounded-md mt-0.5', styles.icon)}>
          <Icon size={14} strokeWidth={2.2} />
        </div>
      )}
      <div className="flex-1 min-w-0 text-sm">
        {title && <div className={classNames('font-medium leading-tight', styles.title)}>{title}</div>}
        {children && <div className={classNames('text-foreground/80 mt-1 text-[0.8rem]', title ? 'leading-relaxed' : undefined)}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}
