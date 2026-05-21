'use client';

import classNames from 'classnames';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import React from 'react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'ai';

interface AccentPanelProps {
  tone?: Tone;
  icon?: LucideIcon;
  title?: React.ReactNode;
  titleInfo?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  glow?: boolean;
}

const styles: Record<Tone, { surface: string; iconBg: string; iconColor: string; bar: string; chip: string; mesh: string }> = {
  primary: {
    surface: 'from-primary/8 via-primary/3',
    iconBg: 'bg-primary text-primary-foreground',
    iconColor: 'text-primary',
    bar: 'bg-gradient-to-b from-primary to-primary/40',
    chip: 'bg-primary/15 text-primary',
    mesh: 'before:bg-[radial-gradient(at_100%_0%,oklch(0.56_0.24_275/0.18),transparent_50%),radial-gradient(at_0%_100%,oklch(0.62_0.16_200/0.10),transparent_50%)]',
  },
  ai: {
    surface: 'from-primary/8 via-primary/2',
    iconBg: 'bg-gradient-to-br from-primary to-violet-500 text-primary-foreground',
    iconColor: 'text-primary',
    bar: 'bg-gradient-to-b from-primary via-violet-500 to-fuchsia-500',
    chip: 'bg-primary/15 text-primary',
    mesh: 'before:bg-[radial-gradient(at_100%_0%,oklch(0.56_0.24_275/0.18),transparent_55%),radial-gradient(at_0%_100%,oklch(0.55_0.22_320/0.10),transparent_50%)]',
  },
  success: {
    surface: 'from-emerald-100/40 via-emerald-50/20',
    iconBg: 'bg-emerald-500 text-white',
    iconColor: 'text-emerald-600',
    bar: 'bg-gradient-to-b from-emerald-500 to-teal-400',
    chip: 'bg-emerald-100 text-emerald-700',
    mesh: 'before:bg-[radial-gradient(at_100%_0%,oklch(0.65_0.18_150/0.15),transparent_50%)]',
  },
  warning: {
    surface: 'from-amber-100/40 via-amber-50/20',
    iconBg: 'bg-amber-500 text-white',
    iconColor: 'text-amber-700',
    bar: 'bg-gradient-to-b from-amber-500 to-orange-400',
    chip: 'bg-amber-100 text-amber-800',
    mesh: 'before:bg-[radial-gradient(at_100%_0%,oklch(0.72_0.16_60/0.18),transparent_50%)]',
  },
  danger: {
    surface: 'from-rose-100/40 via-rose-50/20',
    iconBg: 'bg-rose-500 text-white',
    iconColor: 'text-rose-600',
    bar: 'bg-gradient-to-b from-rose-500 to-pink-400',
    chip: 'bg-rose-100 text-rose-700',
    mesh: 'before:bg-[radial-gradient(at_100%_0%,oklch(0.62_0.22_25/0.18),transparent_50%)]',
  },
  info: {
    surface: 'from-sky-100/40 via-sky-50/20',
    iconBg: 'bg-sky-500 text-white',
    iconColor: 'text-sky-700',
    bar: 'bg-gradient-to-b from-sky-500 to-indigo-400',
    chip: 'bg-sky-100 text-sky-700',
    mesh: 'before:bg-[radial-gradient(at_100%_0%,oklch(0.62_0.16_200/0.18),transparent_50%)]',
  },
};

export function AccentPanel({
  tone = 'primary',
  icon: Icon,
  title,
  titleInfo,
  description,
  action,
  children,
  className,
  glow = false,
}: AccentPanelProps) {
  const s = styles[tone];
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={classNames(
        'relative overflow-hidden rounded-lg border border-border bg-card before:absolute before:inset-0 before:pointer-events-none',
        glow ? 'shadow-glow' : 'shadow-soft',
        s.mesh,
        className,
      )}
    >
      <div className={classNames('relative bg-gradient-to-br to-transparent', s.surface)}>
        <div className="flex gap-4 p-5">
          <div className={classNames('w-[3px] shrink-0 rounded-full', s.bar)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-start gap-3 min-w-0">
                {Icon && (
                  <div className={classNames('flex h-9 w-9 shrink-0 items-center justify-center rounded-md shadow-sm', s.iconBg)}>
                    <Icon size={16} strokeWidth={2.2} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {title && (
                    <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground leading-tight">
                      {title}
                      {titleInfo && <InfoTooltip content={titleInfo} />}
                    </h3>
                  )}
                  {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
                </div>
              </div>
              {action && <div className="shrink-0">{action}</div>}
            </div>
            {children && <div className="text-sm text-foreground/85">{children}</div>}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
