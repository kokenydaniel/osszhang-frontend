'use client';

import Link from 'next/link';
import classNames from 'classnames';
import { formatHUF } from '@/utils';
import { Section, StatusPill, EmptyState } from '@/components/design';
import { ChevronRight, ReceiptText } from 'lucide-react';
import type { DashboardPageState } from '@/components/modules/dashboard/hooks/use-dashboard-page-state';

type Props = Pick<DashboardPageState, 'monthBills' | 'todayStr'>;

export function DashboardUtilitiesSnapshot({ monthBills, todayStr }: Props) {
  return (
    <Section
      title="Aktuális rezsi"
      description={`${monthBills.length} számla ebben a hónapban`}
      action={
        <Link href="/utilities" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5">
          Részletek <ChevronRight size={11} />
        </Link>
      }
    >
      {monthBills.length === 0 ? (
        <EmptyState icon={ReceiptText} title="Nincs rezsi" description="Ebben a hónapban még nincs rögzített számla." />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-soft">
          {monthBills
            .slice()
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            .slice(0, 6)
            .map((b, i) => {
              const overdue = !b.paidDate && b.dueDate < todayStr;
              return (
                <div
                  key={b.id}
                  className={classNames(
                    'flex items-center gap-3 px-4 py-3 group hover:bg-muted/30 transition-colors',
                    i > 0 && 'border-t border-border',
                  )}
                >
                  <div
                    className={classNames(
                      'h-9 w-9 shrink-0 rounded-md flex items-center justify-center text-white shadow-sm',
                      b.paidDate
                        ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                        : overdue
                          ? 'bg-gradient-to-br from-rose-400 to-pink-500'
                          : 'bg-gradient-to-br from-amber-400 to-orange-500',
                    )}
                  >
                    <ReceiptText size={14} strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{b.type}</div>
                    <div className="text-[0.7rem] text-muted-foreground tabular-nums mt-0.5">
                      {b.dueDate.replace(/-/g, '.')}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-foreground tabular-nums">{formatHUF(b.total)}</div>
                    <StatusPill
                      status={b.paidDate ? 'success' : overdue ? 'danger' : 'warning'}
                      size="xs"
                      dot
                    >
                      {b.paidDate ? 'kész' : overdue ? 'lejárt' : 'függőben'}
                    </StatusPill>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </Section>
  );
}
