'use client';

import classNames from 'classnames';
import type { LucideIcon } from 'lucide-react';
import { IconPod, type IconPodTone } from './IconPod';

interface EntityCellProps {
  icon: LucideIcon;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  tone?: IconPodTone;
  size?: 'sm' | 'md';
  solidIcon?: boolean;
  className?: string;
}

export function EntityCell({
  icon,
  title,
  subtitle,
  badge,
  tone = 'neutral',
  size = 'sm',
  solidIcon = false,
  className,
}: EntityCellProps) {
  return (
    <div className={classNames('flex items-center gap-3 min-w-0', className)}>
      <IconPod icon={icon} tone={tone} size={size === 'sm' ? 'sm' : 'md'} solid={solidIcon} />
      <div className="min-w-0">
        <div className="font-medium text-sm text-foreground truncate flex items-center gap-2">
          <span className="truncate">{title}</span>
          {badge}
        </div>
        {subtitle ? <div className="text-[0.7rem] text-muted-foreground mt-0.5 truncate">{subtitle}</div> : null}
      </div>
    </div>
  );
}
