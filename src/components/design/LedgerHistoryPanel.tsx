'use client';

import classNames from 'classnames';
import { formatDate, formatHUF } from '@/utils';
import { EmptyState } from './EmptyState';

export interface LedgerHistoryItem {
  id: number;
  reason: string;
  date: string;
  amount: number;
}

interface LedgerHistoryPanelProps {
  items?: LedgerHistoryItem[];
  emptyText?: string;
  editingId?: number | null;
  formatAmount?: (amount: number) => string;
  actions?: (item: LedgerHistoryItem) => React.ReactNode;
}

export function LedgerHistoryPanel({
  items,
  emptyText = 'Még nincsenek tételek.',
  editingId,
  formatAmount = formatHUF,
  actions,
}: LedgerHistoryPanelProps) {
  return (
    <div className="border-t border-border pt-4">
      <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Korábbi tételek
      </p>
      <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto">
        {!items || items.length === 0 ? (
          <EmptyState variant="compact" title={emptyText} />
        ) : (
          items
            .slice()
            .reverse()
            .map((item) => (
              <div
                key={item.id}
                className={classNames(
                  'flex justify-between items-center bg-muted/40 border border-border rounded-md px-3 py-2',
                  editingId === item.id && 'ring-1 ring-primary/30 bg-primary/[0.04]',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{item.reason}</p>
                  <p className="text-[0.7rem] text-muted-foreground tabular-nums">{formatDate(item.date)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p
                    className={classNames(
                      'text-sm font-semibold tabular-nums',
                      item.amount >= 0 ? 'text-emerald-600' : 'text-rose-600',
                    )}
                  >
                    {item.amount >= 0 ? '+' : ''}
                    {formatAmount(item.amount)}
                  </p>
                  {actions?.(item)}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
