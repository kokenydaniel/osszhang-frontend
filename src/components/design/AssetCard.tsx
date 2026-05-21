'use client';

import classNames from 'classnames';
import type { LucideIcon } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { IconPod, type IconPodTone } from './IconPod';

interface AssetCardProps {
  icon: LucideIcon;
  iconTone?: IconPodTone;
  iconClassName?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  value: React.ReactNode;
  inactive?: boolean;
  onDelete?: () => void;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  hoverLift?: boolean;
}

export function AssetCard({
  icon,
  iconTone = 'primary',
  iconClassName,
  title,
  subtitle,
  value,
  inactive,
  onDelete,
  footer,
  children,
  className,
  hoverLift = true,
}: AssetCardProps) {
  return (
    <motion.article
      layout={false}
      whileHover={hoverLift ? { y: -2 } : undefined}
      className={classNames(
        'rounded-lg border border-border bg-card p-5 flex flex-col gap-4 transition-shadow shadow-soft hover:shadow-lift overflow-hidden',
        inactive && 'opacity-60',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {iconClassName ? (
            <div className={classNames('flex h-9 w-9 shrink-0 items-center justify-center rounded-md shadow-sm', iconClassName)}>
              {(() => {
                const Icon = icon;
                return <Icon size={15} strokeWidth={2.2} />;
              })()}
            </div>
          ) : (
            <IconPod icon={icon} tone={iconTone} size="sm" solid />
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground tracking-tight truncate">{title}</h3>
            {subtitle ? <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p> : null}
          </div>
        </div>
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
            aria-label="Törlés"
          >
            <Trash2 size={13} />
          </button>
        ) : null}
      </div>
      <div>{value}</div>
      {children}
      {footer ? <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">{footer}</div> : null}
    </motion.article>
  );
}
