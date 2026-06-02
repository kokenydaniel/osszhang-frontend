import Link from 'next/link';
import classNames from 'classnames';
import { formatHUF, hasSettlementDate } from '@/utils';
import { utilitiesCalculations } from '@/calculations/utilities';
import { Section, StatusPill, EmptyState, DataList, DataRow } from '@/components/design';
import { ChevronRight, ReceiptText } from 'lucide-react';
import type { UtilityBill } from '@/types';

type Props = {
  monthBills: UtilityBill[];
  todayStr: string;
  utilitySplitEnabled: boolean;
};

export function DashboardUtilitiesSnapshot({ monthBills, todayStr, utilitySplitEnabled }: Props) {
  const items = monthBills
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);

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
        <DataList className="shadow-soft">
          {items.map((b) => {
            const settled = utilitySplitEnabled ? !!b.paidBy : hasSettlementDate(b.paidDate);
            const overdue = utilitiesCalculations.isBillOverdue(b, { splitEnabled: utilitySplitEnabled, today: todayStr });
            return (
              <DataRow
                key={b.id}
                leading={
                  <div
                    className={classNames(
                      'h-9 w-9 shrink-0 rounded-md flex items-center justify-center text-white shadow-sm',
                      settled
                        ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                        : overdue
                          ? 'bg-gradient-to-br from-rose-400 to-pink-500'
                          : 'bg-gradient-to-br from-amber-400 to-orange-500',
                    )}
                  >
                    <ReceiptText size={14} strokeWidth={2.2} />
                  </div>
                }
                title={b.type}
                subtitle={b.dueDate.replace(/-/g, '.')}
                trailing={
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-sm font-semibold text-foreground tabular-nums">{formatHUF(b.total)}</div>
                    <StatusPill status={settled ? 'success' : overdue ? 'danger' : 'warning'} size="xs" dot>
                      {settled ? 'kész' : overdue ? 'lejárt' : 'függőben'}
                    </StatusPill>
                  </div>
                }
              />
            );
          })}
        </DataList>
      )}
    </Section>
  );
}
