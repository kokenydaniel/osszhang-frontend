'use client';

import classNames from 'classnames';
import type { LucideIcon } from 'lucide-react';
import { IconPod, type IconPodTone } from './IconPod';
import { motion } from 'motion/react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface SectionPanelProps {
  title: string;
  description?: string;
  info?: React.ReactNode;
  icon?: LucideIcon;
  tone?: IconPodTone;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionPanel({
  title,
  description,
  info,
  icon,
  tone = 'primary',
  action,
  badge,
  children,
  className,
  noPadding,
}: SectionPanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={classNames(
        'rounded-lg border border-border bg-card shadow-sm overflow-hidden',
        className,
      )}
    >
      <header className="flex flex-col gap-3 border-b border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {icon && <IconPod icon={icon} tone={tone} size="sm" />}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground">
                {title}
                {info && <InfoTooltip content={info} />}
              </h2>
              {badge}
            </div>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className={classNames(!noPadding && 'p-5')}>{children}</div>
    </motion.section>
  );
}
