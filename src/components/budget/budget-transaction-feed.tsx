'use client';

import { useState } from 'react';
import classNames from 'classnames';
import { formatHUF, formatDate, isDueOverdue, hasSettlementDate, today as todayDate } from '@/utils';
import { formatTransactionAmount, toHuf } from '@/utils/money';
import { CashTransaction, LedgerEntry, UtilityBill } from '@/types';
import { savingsCalculations } from '@/calculations/savings';

const { goalActual: savingsGoalActual, goalIsFullyPaid: savingsGoalIsFullyPaid, goalBudgetStatus: savingsGoalBudgetStatus } = savingsCalculations;
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Modal } from '@/components/ui/Modal';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { DatePicker } from '@/components/ui/DatePicker';
import { HELP } from '@/config/help';
import {
  DataTable,
  Section,
  StatusPill,
  StatusToggleButton,
  EmptyState,
  EntityCell,
  DueDateCell,
  ProgressBar,
  RowActions,
  type DataTableColumn,
} from '@/components/design';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CheckCircle,
  Clock,
  Folder,
  History,
  PiggyBank,
  ReceiptText,
  Wallet,
} from 'lucide-react';
import { isExternallyManagedBudgetRow, mapTransactionsToGroupedFeed, type BudgetTableItem } from '@/helpers/budget-feed';

export type BudgetTransactionFeedProps = {
  items: CashTransaction[];
  title: string;
  type: 'income' | 'expense';
  includeBills?: boolean;
  categories: string[];
  monthlyBills: UtilityBill[];
  getBillPortion: (b: UtilityBill) => number;
  today: string;
  isReader: boolean;
  categoryColor?: (name: string) => string | undefined;
  onEdit: (tx: CashTransaction) => void;
  onOpenLedger: (txId: number | string) => void;
  onOpenGoalPayment: (goalRow: CashTransaction) => void;
  onUpdateTransaction: (
    id: number | string,
    data: Partial<Omit<CashTransaction, 'id'>>,
  ) => Promise<void>;
  onDeleteTransaction: (id: number | string) => Promise<void>;
  requestDelete: (options: { title: string; message: string; onConfirm: () => void | Promise<void> }) => void;
  wrapTxPending: (id: number | string, fn: () => Promise<void>) => Promise<void>;
  isTxPending: (id: number | string) => boolean;
  exchangeRates?: Record<string, number>;
};

export function BudgetTransactionFeed({
  items,
  title,
  type,
  includeBills = false,
  categories,
  monthlyBills,
  getBillPortion,
  today,
  categoryColor,
  onEdit,
  onOpenLedger,
  onOpenGoalPayment,
  onUpdateTransaction,
  onDeleteTransaction,
  requestDelete,
  wrapTxPending,
  isTxPending,
  isReader,
  exchangeRates = { HUF: 1 },
}: BudgetTransactionFeedProps) {
  const [dateModalTx, setDateModalTx] = useState<CashTransaction | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayDate());

  const openDateModal = (tx: CashTransaction) => {
    setDateModalTx(tx);
    const initialDate = tx.paidDate ? tx.paidDate.slice(0, 10) : todayDate();
    setSelectedDate(initialDate);
  };

  const grouped = mapTransactionsToGroupedFeed(items, type, includeBills, categories, monthlyBills, getBillPortion);
  const totalCount = Object.values(grouped).reduce((s, arr) => s + arr.length, 0);

  if (Object.keys(grouped).length === 0) {
    return (
      <Section
        title={title}
        description={`Még nincs ${type === 'income' ? 'bevétel' : 'kiadás'} rögzítve ebben a hónapban.`}
      >
        <EmptyState
          icon={type === 'income' ? ArrowUpRight : ArrowDownRight}
          title={`Nincs ${type === 'income' ? 'bevétel' : 'kiadás'}`}
          description="Használd a jobb felső sarokban az „Új tétel” gombot az első tétel rögzítéséhez."
        />
      </Section>
    );
  }

  const flatItems = Object.entries(grouped).flatMap(([cat, list]) =>
    list.map((item) => ({ ...item, _category: cat })),
  );

  const columns: DataTableColumn<BudgetTableItem & { _category: string }>[] = [
    {
      key: 'description',
      header: 'Megnevezés',
      width: '260px',
      className: 'w-[260px] max-w-[260px] min-w-[220px]',
      cell: (t) => {
        const settled = hasSettlementDate(t.paidDate);
        const isOverdue = isDueOverdue(t, today);
        const Icon = t.isBill ? ReceiptText : t.isSavingsGoal ? PiggyBank : type === 'income' ? ArrowUpRight : ArrowDownRight;
        const tone = t.isSavingsGoal
          ? 'primary'
          : settled
            ? 'success'
            : isOverdue
              ? 'danger'
              : type === 'income'
                ? 'success'
                : 'warning';
        return (
          <EntityCell
            icon={Icon}
            tone={tone}
            title={t.description}
            wrap
            badge={
              t.isBill ? (
                <StatusPill status="info" size="xs">
                  <Building2 size={9} /> rezsi
                </StatusPill>
              ) : t.isSavingsGoal ? (
                <StatusPill status="info" size="xs">
                  <PiggyBank size={9} /> cél
                </StatusPill>
              ) : undefined
            }
          />
        );
      },
    },
    {
      key: 'date',
      header: 'Határidő',
      width: '14%',
      cell: (t) => {
        if (t.isSavingsGoal) {
          const actual = savingsGoalActual(t.subItems);
          const overdue = !savingsGoalIsFullyPaid(t.amount, actual) && today > t.dueDate;
          return (
            <DueDateCell
              date={t.dueDate}
              today={today}
              settled={savingsGoalIsFullyPaid(t.amount, actual)}
              overdue={overdue}
            />
          );
        }
        return (
          <DueDateCell
            date={t.dueDate}
            today={today}
            settled={hasSettlementDate(t.paidDate)}
            overdue={isDueOverdue(t, today)}
          />
        );
      },
    },
    {
      key: 'budget',
      header: 'Felhasználva',
      width: '22%',
      cell: (t) => {
        if (!t.isBudget) return <span className="text-xs text-muted-foreground/60">—</span>;
        const spent = t.subItems ? t.subItems.reduce((acc, si) => acc + Math.abs(si.amount), 0) : 0;
        const content = (
          <>
            <span className="text-[0.65rem] text-primary inline-flex items-center gap-1 group-hover/budget:underline">
              <History size={10} /> {t.subItems?.length || 0} ledger · {formatHUF(spent)}/{formatHUF(t.amount)}
            </span>
            <ProgressBar value={spent} max={t.amount} size="md" tone="thresholds" />
          </>
        );
        if (isReader) {
          return <div className="flex flex-col gap-1 w-full opacity-80">{content}</div>;
        }
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenLedger(t.id);
            }}
            className="flex flex-col gap-1 w-full text-left group/budget"
          >
            {content}
          </button>
        );
      },
    },
    {
      key: 'amount',
      header: 'Összeg',
      align: 'right',
      width: '14%',
      cell: (t) => {
        const spent =
          t.isBudget && t.subItems
            ? t.subItems.reduce((acc, si) => acc + Math.abs(toHuf(si.amount, t.currency, exchangeRates)), 0)
            : 0;
        const remaining = toHuf(t.amount, t.currency, exchangeRates) - spent;
        const display = formatTransactionAmount(t.amount, t.currency, exchangeRates);
        return (
          <div className="flex flex-col items-end">
            <span
              className={classNames(
                'text-sm font-semibold tabular-nums whitespace-nowrap',
                type === 'income' ? 'text-emerald-600' : 'text-foreground',
              )}
            >
              {display}
            </span>
            {t.isBudget && (
              <span
                className={classNames(
                  'text-[0.65rem] tabular-nums',
                  remaining < 0 ? 'text-rose-600 font-semibold' : 'text-muted-foreground',
                )}
              >
                marad {formatHUF(Math.round(remaining))}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: (
        <span className="inline-flex items-center justify-center gap-1 w-full">
          <span>Státusz</span>
          <InfoTooltip content={HELP.budget.statusToggle} side="top" label="Státusz – kattintható" />
        </span>
      ),
      align: 'center',
      width: '12%',
      cell: (t) => {
        if (t.isSavingsGoal) {
          const actual = savingsGoalActual(t.subItems);
          const status = savingsGoalBudgetStatus(t.amount, actual, t.dueDate, today);

          if (status === 'paid') {
            return (
              <StatusPill status="success" size="xs" dot>
                <CheckCircle size={9} /> {formatHUF(actual)} befizetve
              </StatusPill>
            );
          }

          if (isReader) {
            return (
              <StatusPill status={status === 'overdue' ? 'danger' : 'warning'} size="xs" dot>
                {status === 'overdue' ? 'Lejárt' : 'Nincs befizetés'}
              </StatusPill>
            );
          }

          return (
            <Button
              type="button"
              size="xs"
              variant={status === 'overdue' ? 'destructive' : 'default'}
              className={classNames(
                'h-7 gap-1 text-[0.65rem] font-semibold',
                status === 'pending' && 'bg-amber-500/15 text-amber-800 hover:bg-amber-500/25 border-amber-500/30',
              )}
              onClick={(e) => {
                e.stopPropagation();
                onOpenGoalPayment(t as unknown as CashTransaction);
              }}
            >
              {status === 'overdue' ? (
                <>
                  <AlertCircle size={11} /> Lejárt — Befizetés
                </>
              ) : actual > 0 ? (
                <>
                  <Wallet size={11} /> További befizetés
                </>
              ) : (
                <>
                  <Wallet size={11} /> Befizetés
                </>
              )}
            </Button>
          );
        }
        if (t.isBill) {
          const settled = hasSettlementDate(t.paidDate);
          return (
            <StatusPill status={settled ? 'success' : 'warning'} size="xs" dot>
              {settled ? 'kész' : 'függőben'}
            </StatusPill>
          );
        }
        const settled = hasSettlementDate(t.paidDate);
        const isOverdue = isDueOverdue(t, today);
        const statusLabel = settled
          ? `Kifizetve (${formatDate(t.paidDate!)}) — kattints visszaállításhoz`
          : isOverdue
            ? 'Lejárt — kattints kifizetettként jelöléshez'
            : 'Függőben — kattints kifizetettként jelöléshez';
        return (
          <StatusToggleButton
            status={settled ? 'success' : isOverdue ? 'danger' : 'warning'}
            title={statusLabel}
            disabled={isReader}
            onClick={() => {
              if (isReader) return;
              openDateModal(t as unknown as CashTransaction);
            }}
          >
            {settled ? (
              <>
                <CheckCircle size={9} /> {formatDate(t.paidDate!)}
              </>
            ) : isOverdue ? (
              <>
                <AlertCircle size={9} /> lejárt
              </>
            ) : (
              <>
                <Clock size={9} /> függőben
              </>
            )}
          </StatusToggleButton>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '8%',
      cell: (t) =>
        !t.isBill && !t.isSavingsGoal && !isExternallyManagedBudgetRow(t.id) && !isReader ? (
          <RowActions
            onEdit={() => {
              const original = items.find((item) => item.id === t.id);
              if (original) onEdit(original);
            }}
            onDelete={() =>
              requestDelete({
                title: 'Tétel törlése',
                message: `Biztosan törlöd a „${t.description}" tételt? Ez a művelet nem vonható vissza.`,
                onConfirm: () => onDeleteTransaction(t.id as number),
              })
            }
          />
        ) : isExternallyManagedBudgetRow(t.id) ? (
          <span className="text-[0.65rem] text-muted-foreground" title="A Tartozások / Biztosítások modulban szerkeszthető">
            szinkron
          </span>
        ) : null,
    },
  ];

  return (
    <Section title={`${title} · ${totalCount}`}>
      <DataTable
        columns={columns}
        data={flatItems}
        rowKey={(t) => `${t._category}-${t.id}`}
        groupBy={(t) => t._category}
        groupHeader={(group, rows) => {
          const groupTotal = rows.reduce((s, r) => s + toHuf(r.amount, r.currency, exchangeRates), 0);
          const color = categoryColor?.(group);
          return (
            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wider"
                style={{ color: color ?? undefined }}
              >
                <Folder size={11} strokeWidth={2.2} style={{ color: color ?? undefined }} />
                {group}
              </span>
              <span className="text-xs font-semibold tabular-nums text-foreground">{formatHUF(groupTotal)}</span>
            </div>
          );
        }}
        minWidth="780px"
      />

      <Modal
        isOpen={dateModalTx !== null}
        onClose={() => setDateModalTx(null)}
        title={type === 'income' ? 'Beérkezés dátuma' : 'Kifizetés dátuma'}
        description={dateModalTx ? `„${dateModalTx.description}" tétel igazolása` : undefined}
        size="sm"
      >
        {dateModalTx && (
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <FieldLabel>
                {type === 'income' ? 'Mikor érkezett be az összeg?' : 'Mikor történt a kifizetés?'}
              </FieldLabel>
              <DatePicker
                value={selectedDate}
                onChange={(val) => setSelectedDate(val)}
                placeholder="Válassz dátumot"
              />
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  onClick={() => setSelectedDate(todayDate())}
                  className="text-[0.7rem] h-6 font-normal"
                >
                  Ma ({formatDate(todayDate())})
                </Button>
                {dateModalTx.dueDate && (
                  <Button
                    type="button"
                    size="xs"
                    variant="secondary"
                    onClick={() => setSelectedDate(dateModalTx.dueDate.slice(0, 10))}
                    className="text-[0.7rem] h-6 font-normal"
                  >
                    Határidő ({formatDate(dateModalTx.dueDate)})
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border w-full">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDateModalTx(null)}
                >
                  Mégse
                </Button>
                {hasSettlementDate(dateModalTx.paidDate) && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      void onUpdateTransaction(dateModalTx.id, { paidDate: null });
                      setDateModalTx(null);
                    }}
                  >
                    Visszaállítás
                  </Button>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  void onUpdateTransaction(dateModalTx.id, { paidDate: selectedDate });
                  setDateModalTx(null);
                }}
              >
                <CheckCircle size={14} className="mr-1.5 shrink-0" />
                Mentés
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Section>
  );
}
