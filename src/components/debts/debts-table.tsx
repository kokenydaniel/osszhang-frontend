'use client';

import classNames from 'classnames';
import { formatHUF } from '@/utils';
import { debtsCalculations } from '@/calculations/debts';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  Section,
  EmptyState,
  EntityCell,
  ProgressBar,
  RowActions,
  type DataTableColumn,
} from '@/components/design';
import {
  Banknote,
  CreditCard,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import type { DebtWithPayoff } from '@/calculations/debts';

export type DebtsTableProps = {
  debtsWithPayoff: DebtWithPayoff[];
  totalDebt: number;
  monthlyMinimum: number;
  isReader: boolean;
  onPay: (debt: DebtWithPayoff) => void;
  onEdit: (debt: DebtWithPayoff) => void;
  onDelete: (id: number) => void;
  requestDelete: (options: { title: string; message: string; onConfirm: () => void }) => void;
};

export function DebtsTable({
  debtsWithPayoff,
  totalDebt,
  monthlyMinimum,
  isReader,
  onPay,
  onEdit,
  onDelete,
  requestDelete,
}: DebtsTableProps) {
  const columns: DataTableColumn<DebtWithPayoff>[] = [
    {
      key: 'name',
      header: 'Tartozás',
      width: '24%',
      cell: (d) => (
        <EntityCell
          icon={CreditCard}
          tone={d.payoff.isUnderwater ? 'danger' : 'primary'}
          title={d.name}
          subtitle={
            <>
              {d.dueDay ? `Minden hó ${d.dueDay}. · ` : ''}Eredeti: {formatHUF(d.targetAmount)}
            </>
          }
        />
      ),
    },
    {
      key: 'progress',
      header: 'Visszafizetve',
      width: '20%',
      cell: (d) => {
        const progress = d.targetAmount > 0 ? Math.min(100, (d.paidAmount / d.targetAmount) * 100) : 0;
        const barClassName =
          progress >= 100
            ? 'bg-emerald-500'
            : progress >= 75
              ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
              : progress >= 25
                ? 'bg-gradient-to-r from-primary to-violet-500'
                : 'bg-gradient-to-r from-rose-400 to-orange-500';
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
            <ProgressBar value={d.paidAmount} max={d.targetAmount} size="md" barClassName={barClassName} />
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
              {debtsCalculations.formatPayoffDate(d.payoff.payoffDate)}
            </span>
            <span className="text-[0.65rem] text-muted-foreground">{debtsCalculations.formatTerm(d.payoff.months)}</span>
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
              onClick={() => onPay(d)}
            >
              <Banknote size={12} /> Befizetés
            </Button>
            <RowActions
              onEdit={() => onEdit(d)}
              onDelete={() =>
                requestDelete({
                  title: 'Tartozás törlése',
                  message: `Biztosan törlöd a „${d.name}" tartozást? Ez a művelet nem vonható vissza.`,
                  onConfirm: () => onDelete(d.id),
                })
              }
            />
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
