'use client';

import classNames from 'classnames';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function PageHero({ eyebrow, title, subtitle, icon: Icon, action, meta, className }: PageHeroProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={classNames('flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pb-2', className)}
    >
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-medium text-muted-foreground mb-1">{eyebrow}</p>
          )}
          <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-foreground leading-tight">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-1.5 text-sm text-muted-foreground">{subtitle}</div>
          )}
        </div>
      </div>
      {(action || meta) && (
        <div className="flex flex-col items-start gap-2 lg:items-end shrink-0">
          {meta}
          {action}
        </div>
      )}
    </motion.section>
  );
}
