'use client';

import classNames from 'classnames';
import { formatTransactionAmount } from '@/utils/money';
import { isDueOverdue } from '@/utils';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  Section,
  StatusPill,
  EmptyState,
  type DataTableColumn,
} from '@/components/design';
import { Check, Calendar, ReceiptText, Wallet } from 'lucide-react';
import type { DashboardUnpaidItem } from '@/helpers/dashboard-types';

type Props = {
  unpaidItemsList: DashboardUnpaidItem[];
  todayStr: string;
  exchangeRates: Record<string, number>;
  handlePayItem: (item: DashboardUnpaidItem) => void | Promise<void>;
  isReader: boolean;
};

export function DashboardUnpaidSection({ unpaidItemsList, todayStr, exchangeRates, handlePayItem, isReader }: Props) {
  return (
    <div className="lg:col-span-3">
      <Section
        title="Közelgő kifizetések"
        description={`${unpaidItemsList.length} tétel lejárt vagy esedékes a következő 3 napban`}
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
            description="A következő napokban és múltban sincs rendezetlen fizetendő tétel."
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
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {formatTransactionAmount(item.amount, item.currency, exchangeRates)}
                  </span>
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
