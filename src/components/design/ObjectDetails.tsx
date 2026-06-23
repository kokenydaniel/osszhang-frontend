'use client';

import classNames from 'classnames';
import type { LucideIcon } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { metricLabelClassName } from './metric-label';

export interface DetailItem {
  label: React.ReactNode;
  value: React.ReactNode;
  info?: React.ReactNode;
}

export interface DetailGroup {
  title?: React.ReactNode;
  items: DetailItem[];
}

interface ObjectDetailsProps {
  groups: DetailGroup[];
  className?: string;
  columns?: 1 | 2;
  compact?: boolean;
}

export function ObjectDetails({ groups, className, columns = 1, compact }: ObjectDetailsProps) {
  return (
    <div className={classNames('flex flex-col gap-4', className)}>
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex flex-col gap-2">
          {group.title ? (
            <h4 className={metricLabelClassName('font-semibold')}>
              {group.title}
            </h4>
          ) : null}
          <dl
            className={classNames(
              'grid gap-3',
              columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1',
            )}
          >
            {group.items.map((item, itemIndex) => (
              <div key={itemIndex} className="min-w-0">
                <dt
                  className={metricLabelClassName(
                    'inline-flex items-center gap-1',
                    !compact && 'text-sm',
                  )}
                >
                  {item.label}
                  {item.info ? <InfoTooltip content={item.info} /> : null}
                </dt>
                <dd
                  className={classNames(
                    'font-medium text-foreground break-words',
                    compact ? 'text-xs tabular-nums mt-0.5' : 'text-sm mt-0.5',
                  )}
                >
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
