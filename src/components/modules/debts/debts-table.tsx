'use client';

import classNames from 'classnames';
import { formatHUF } from '@/utils';
import { formatPayoffDate, formatTerm } from '@/utils/debt';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  Section,
  EmptyState,
  type DataTableColumn,
} from '@/components/design';
import {
  Edit3,
  Trash2,
  CreditCard,
  Banknote,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import type { DebtsPageState, DebtWithPayoff } from '@/components/modules/debts/hooks/use-debts-page-state';

type DebtsTableProps = Pick<
  DebtsPageState,
  | 'debtsWithPayoff'
  | 'totalDebt'
  | 'monthlyMinimum'
  | 'isReader'
  | 'openPayModal'
  | 'openForm'
  | 'deleteDebt'
  | 'requestDelete'
>;

export function DebtsTable({
  debtsWithPayoff,
  totalDebt,
  monthlyMinimum,
  isReader,
  openPayModal,
  openForm,
  deleteDebt,
  requestDelete,
}: DebtsTableProps) {
  const columns: DataTableColumn<DebtWithPayoff>[] = [
    {
      key: 'name',
      header: 'Tartozás',
      width: '24%',
      cell: (d) => {
        const tone = d.payoff.isUnderwater ? 'bg-rose-100 text-rose-700' : 'bg-violet-100 text-violet-700';
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className={classNames('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', tone)}>
              <CreditCard size={13} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm text-foreground truncate">{d.name}</div>
              <div className="text-[0.7rem] text-muted-foreground mt-0.5">
                {d.dueDay ? `Minden hó ${d.dueDay}. · ` : ''}Eredeti: {formatHUF(d.targetAmount)}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'progress',
      header: 'Visszafizetve',
      width: '20%',
      cell: (d) => {
        const progress = d.targetAmount > 0 ? Math.min(100, (d.paidAmount / d.targetAmount) * 100) : 0;
        return (
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex justify-between items-center">
              <span className="text-[0.7rem] text-muted-foreground tabular-nums truncate mr-2">
                {formatHUF(d.paidAmount)}
              </span>
              <span className="text-[0.7rem] font-semibold text-foreground tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>
            <span className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <span
                className={classNames(
                  'block h-full rounded-full transition-all',
                  progress >= 100
                    ? 'bg-emerald-500'
                    : progress >= 75
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                      : progress >= 25
                        ? 'bg-gradient-to-r from-primary to-violet-500'
                        : 'bg-gradient-to-r from-rose-400 to-orange-500',
                )}
                style={{ width: `${progress}%` }}
              />
            </span>
          </div>
        );
      },
    },
    {
      key: 'remaining',
      header: 'Hátralévő',
      align: 'right',
      width: '13%',
      cell: (d) => (
        <span
          className={classNames(
            'text-sm font-semibold tabular-nums',
            d.remaining <= 0 ? 'text-emerald-600' : 'text-foreground',
          )}
        >
          {formatHUF(d.remaining)}
        </span>
      ),
    },
    {
      key: 'minimum',
      header: 'Havi részlet',
      align: 'right',
      width: '12%',
      cell: (d) =>
        d.minimumPayment ? (
          <div className="flex flex-col items-end">
            <span className="text-sm text-foreground/85 tabular-nums">{formatHUF(d.minimumPayment)}</span>
            {d.annualInterestRate && (
              <span className="text-[0.65rem] text-muted-foreground tabular-nums">
                {d.annualInterestRate}% / év
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        ),
    },
    {
      key: 'payoff',
      header: 'Lejár',
      align: 'right',
      width: '16%',
      cell: (d) => {
        if (d.payoff.isUnderwater) {
          return (
            <div className="flex flex-col items-end">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                <AlertTriangle size={11} strokeWidth={2.2} />
                Nincs vége
              </span>
              <span className="text-[0.65rem] text-muted-foreground">
                kell: {formatHUF(d.payoff.minimumViablePayment)}/hó
              </span>
            </div>
          );
        }
        if (!d.payoff.months) {
          return <span className="text-xs text-muted-foreground/60">—</span>;
        }
        return (
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-foreground tabular-nums">
              {formatPayoffDate(d.payoff.payoffDate)}
            </span>
            <span className="text-[0.65rem] text-muted-foreground">{formatTerm(d.payoff.months)}</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '15%',
      cell: (d) =>
        !isReader ? (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="outline"
              size="xs"
              className="text-emerald-700 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300"
              onClick={() => openPayModal(d)}
            >
              <Banknote size={12} /> Befizetés
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => openForm(d)}
            >
              <Edit3 size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() =>
                requestDelete({
                  title: 'Tartozás törlése',
                  message: `Biztosan törlöd a „${d.name}" tartozást? Ez a művelet nem vonható vissza.`,
                  onConfirm: () => deleteDebt(d.id),
                })
              }
            >
              <Trash2 size={13} />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <Section
      title={`Aktív tartozások · ${debtsWithPayoff.length}`}
      description={
        debtsWithPayoff.length > 0
          ? `Összesen ${formatHUF(totalDebt)} van hátra · havi ${formatHUF(monthlyMinimum)} törlesztés`
          : 'Még nincs rögzítve tartozás'
      }
    >
      {debtsWithPayoff.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Nincs aktív tartozás"
          description={
            isReader
              ? 'Még nincs rögzítve tartozás.'
              : 'Adj hozzá egy hitelt vagy kölcsönt a jobb felső sarokban lévő „Új tartozás” gombbal.'
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={debtsWithPayoff.slice().sort((a, b) => b.remaining - a.remaining)}
          rowKey={(d) => d.id}
          minWidth="900px"
        />
      )}
    </Section>
  );
}
