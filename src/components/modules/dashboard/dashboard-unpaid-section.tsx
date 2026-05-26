'use client';

import classNames from 'classnames';
import { formatHUF, isDueOverdue } from '@/utils';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  Section,
  StatusPill,
  EmptyState,
  type DataTableColumn,
} from '@/components/design';
import { Check, Calendar, ReceiptText, Wallet } from 'lucide-react';
import type { DashboardLogicResult } from '@/components/modules/dashboard/hooks/useDashboardLogic';
import type { DashboardUnpaidItem } from '@/components/modules/dashboard/lib/dashboardTypes';

type Props = Pick<DashboardLogicResult, 'unpaidItemsList' | 'todayStr' | 'handlePayItem' | 'isReader'>;

export function DashboardUnpaidSection({ unpaidItemsList, todayStr, handlePayItem, isReader }: Props) {
  return (
    <div className="lg:col-span-3">
      <Section
        title="Közelgő befizetések"
        description={`${unpaidItemsList.length} függőben lévő tétel ebben a hónapban`}
        action={
          unpaidItemsList.length > 0 ? (
            <StatusPill status="primary" dot>
              {unpaidItemsList.length} tétel
            </StatusPill>
          ) : null
        }
      >
        {unpaidItemsList.length === 0 ? (
          <EmptyState
            icon={Check}
            title="Minden rendezve"
            description="Ebben a hónapban nincs több fizetendő tétel."
          />
        ) : (
          <DataTable
            columns={[
              {
                key: 'desc',
                header: 'Tétel',
                width: '40%',
                cell: (item) => {
                  const overdue = isDueOverdue(item, todayStr);
                  const Icon = item.type === 'bill' ? ReceiptText : Wallet;
                  const toneCls = overdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';
                  return (
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={classNames('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', toneCls)}>
                        <Icon size={13} strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-foreground truncate">{item.description}</div>
                        <div className="text-[0.7rem] text-muted-foreground mt-0.5">{item.category}</div>
                      </div>
                    </div>
                  );
                },
              },
              {
                key: 'due',
                header: 'Határidő',
                width: '22%',
                cell: (item) => {
                  const overdue = isDueOverdue(item, todayStr);
                  return (
                    <span
                      className={classNames(
                        'inline-flex items-center gap-1.5 text-xs tabular-nums',
                        overdue ? 'text-rose-600 font-medium' : 'text-muted-foreground',
                      )}
                    >
                      <Calendar size={11} strokeWidth={2.2} />
                      {item.dueDate.replace(/-/g, '.')}
                      {overdue && <span className="text-[10px] uppercase tracking-wider">lejárt</span>}
                    </span>
                  );
                },
              },
              {
                key: 'amount',
                header: 'Összeg',
                align: 'right',
                width: '24%',
                cell: (item) => (
                  <span className="text-sm font-semibold text-foreground tabular-nums">{formatHUF(item.amount)}</span>
                ),
              },
              {
                key: 'action',
                header: '',
                align: 'right',
                width: '14%',
                cell: (item) =>
                  isReader ? null : (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handlePayItem(item)}
                    className="text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                    title="Kifizetve"
                  >
                    <Check size={14} />
                  </Button>
                ),
              },
            ] as DataTableColumn<DashboardUnpaidItem>[]}
            data={unpaidItemsList}
            rowKey={(item) => `${item.type}-${item.id}`}
            minWidth="540px"
          />
        )}
      </Section>
    </div>
  );
}
