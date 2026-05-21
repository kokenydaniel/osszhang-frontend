'use client';

import classNames from 'classnames';
import { formatHUF, formatDate, isDueOverdue, hasSettlementDate, today as todayDate } from '@/utils';
import { CashTransaction, LedgerEntry, UtilityBill } from '@/types';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { HELP } from '@/lib/helpTexts';
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
  ReceiptText,
} from 'lucide-react';
import type { BudgetPageState } from '@/components/modules/budget/hooks/use-budget-page-state';

export interface BudgetTableItem {
  id: number | string;
  description: string;
  category: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  isBill?: boolean;
  isBudget?: boolean;
  subItems?: LedgerEntry[];
  type?: 'income' | 'expense';
}

type BudgetTransactionFeedProps = Pick<
  BudgetPageState,
  | 'categories'
  | 'monthlyBills'
  | 'getBillPortion'
  | 'today'
  | 'openTxForm'
  | 'openLedgerModal'
  | 'updateTransaction'
  | 'deleteTransaction'
  | 'requestDelete'
  | 'wrapTxPending'
  | 'isTxPending'
> & {
  items: CashTransaction[];
  title: string;
  type: 'income' | 'expense';
  includeBills?: boolean;
};

function groupedFeed(
  items: CashTransaction[],
  type: 'income' | 'expense',
  includeBills: boolean,
  categories: string[],
  monthlyBills: UtilityBill[],
  getBillPortion: (b: UtilityBill) => number,
): Record<string, BudgetTableItem[]> {
  const allCats = Array.from(new Set([...categories, ...items.map((i) => i.category || 'Egyéb')]));
  const grouped = allCats.reduce((acc, cat) => {
    let filtered: BudgetTableItem[] = items
      .filter((i) => (i.category || 'Egyéb') === cat)
      .map((i) => ({
        id: i.id,
        description: i.description,
        category: i.category,
        amount: i.amount,
        dueDate: i.dueDate,
        paidDate: i.paidDate,
        isBudget: i.isBudget,
        subItems: i.subItems,
        type: i.type,
      }));
    if (cat === 'Rezsi' && type === 'expense' && includeBills) {
      const billItems: BudgetTableItem[] = monthlyBills
        .map((b) => ({
          id: `bill-${b.id}`,
          description: b.type,
          category: 'Rezsi',
          amount: getBillPortion(b),
          dueDate: b.dueDate,
          paidDate: b.paidDate,
          isBill: true,
        }))
        .filter((b) => b.amount > 0);
      filtered = [...filtered, ...billItems];
    }
    if (filtered.length > 0) acc[cat] = filtered;
    return acc;
  }, {} as Record<string, BudgetTableItem[]>);
  return grouped;
}

export function BudgetTransactionFeed({
  items,
  title,
  type,
  includeBills = false,
  categories,
  monthlyBills,
  getBillPortion,
  today,
  openTxForm,
  openLedgerModal,
  updateTransaction,
  deleteTransaction,
  requestDelete,
  wrapTxPending,
  isTxPending,
}: BudgetTransactionFeedProps) {
  const grouped = groupedFeed(items, type, includeBills, categories, monthlyBills, getBillPortion);
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
      width: '30%',
      cell: (t) => {
        const settled = hasSettlementDate(t.paidDate);
        const isOverdue = isDueOverdue(t, today);
        const Icon = t.isBill ? ReceiptText : type === 'income' ? ArrowUpRight : ArrowDownRight;
        const tone = settled ? 'success' : isOverdue ? 'danger' : type === 'income' ? 'success' : 'warning';
        return (
          <EntityCell
            icon={Icon}
            tone={tone}
            title={t.description}
            badge={
              t.isBill ? (
                <StatusPill status="info" size="xs">
                  <Building2 size={9} /> rezsi
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
      cell: (t) => (
        <DueDateCell
          date={t.dueDate}
          today={today}
          settled={hasSettlementDate(t.paidDate)}
          overdue={isDueOverdue(t, today)}
        />
      ),
    },
    {
      key: 'budget',
      header: 'Felhasználva',
      width: '22%',
      cell: (t) => {
        if (!t.isBudget) return <span className="text-xs text-muted-foreground/60">—</span>;
        const spent = t.subItems ? t.subItems.reduce((acc, si) => acc + Math.abs(si.amount), 0) : 0;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openLedgerModal(t.id as number);
            }}
            className="flex flex-col gap-1 w-full text-left group/budget"
          >
            <span className="text-[0.65rem] text-primary inline-flex items-center gap-1 group-hover/budget:underline">
              <History size={10} /> {t.subItems?.length || 0} ledger · {formatHUF(spent)}/{formatHUF(t.amount)}
            </span>
            <ProgressBar value={spent} max={t.amount} size="md" tone="thresholds" />
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
        const spent = t.isBudget && t.subItems ? t.subItems.reduce((acc, si) => acc + Math.abs(si.amount), 0) : 0;
        const remaining = t.amount - spent;
        return (
          <div className="flex flex-col items-end">
            <span
              className={classNames(
                'text-sm font-semibold tabular-nums',
                type === 'income' ? 'text-emerald-600' : 'text-foreground',
              )}
            >
              {type === 'income' ? '+' : '−'} {formatHUF(t.amount)}
            </span>
            {t.isBudget && (
              <span
                className={classNames(
                  'text-[0.65rem] tabular-nums',
                  remaining < 0 ? 'text-rose-600 font-semibold' : 'text-muted-foreground',
                )}
              >
                marad {formatHUF(remaining)}
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
            pending={isTxPending(t.id as number)}
            onClick={() =>
              void wrapTxPending(t.id as number, () =>
                updateTransaction(t.id as number, {
                  paidDate: settled ? null : todayDate(),
                }),
              )
            }
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
        !t.isBill ? (
          <RowActions
            onEdit={() => openTxForm(t as unknown as CashTransaction)}
            onDelete={() =>
              requestDelete({
                title: 'Tétel törlése',
                message: `Biztosan törlöd a „${t.description}" tételt? Ez a művelet nem vonható vissza.`,
                onConfirm: () => deleteTransaction(t.id as number),
              })
            }
          />
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
          const groupTotal = rows.reduce((s, r) => s + r.amount, 0);
          return (
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
                <Folder size={11} strokeWidth={2.2} />
                {group}
              </span>
              <span className="text-xs font-semibold tabular-nums text-foreground">{formatHUF(groupTotal)}</span>
            </div>
          );
        }}
        minWidth="780px"
      />
    </Section>
  );
}
