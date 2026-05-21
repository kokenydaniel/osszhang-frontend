'use client';

import classNames from 'classnames';
import { formatHUF, formatDate } from '@/utils';
import { CashTransaction, LedgerEntry, UtilityBill } from '@/types';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { HELP } from '@/lib/helpTexts';
import {
  DataTable,
  Section,
  StatusPill,
  StatusToggleButton,
  EmptyState,
  type DataTableColumn,
} from '@/components/design';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Edit3,
  Folder,
  History,
  ReceiptText,
  Trash2,
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
  | 'setActiveTxId'
  | 'setIsLedgerModalOpen'
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
  setActiveTxId,
  setIsLedgerModalOpen,
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
        const isOverdue = !t.paidDate && t.dueDate < today;
        const Icon = t.isBill ? ReceiptText : type === 'income' ? ArrowUpRight : ArrowDownRight;
        const toneCls = t.paidDate
          ? 'bg-emerald-100 text-emerald-700'
          : isOverdue
            ? 'bg-rose-100 text-rose-700'
            : type === 'income'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700';
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className={classNames('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', toneCls)}>
              <Icon size={13} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm text-foreground truncate flex items-center gap-2">
                <span className="truncate">{t.description}</span>
                {t.isBill && (
                  <StatusPill status="info" size="xs">
                    <Building2 size={9} /> rezsi
                  </StatusPill>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'date',
      header: 'Határidő',
      width: '14%',
      cell: (t) => {
        const isOverdue = !t.paidDate && t.dueDate < today;
        return (
          <span
            className={classNames(
              'inline-flex items-center gap-1.5 text-xs tabular-nums',
              isOverdue ? 'text-rose-600 font-medium' : 'text-muted-foreground',
            )}
          >
            <Calendar size={11} strokeWidth={2.2} />
            {formatDate(t.dueDate)}
            {isOverdue && <span className="text-[10px] uppercase tracking-wider">lejárt</span>}
          </span>
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
        const progress = Math.min(100, (spent / t.amount) * 100);
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTxId(t.id as number);
              setIsLedgerModalOpen(true);
            }}
            className="flex flex-col gap-1 w-full text-left group/budget"
          >
            <span className="text-[0.65rem] text-primary inline-flex items-center gap-1 group-hover/budget:underline">
              <History size={10} /> {t.subItems?.length || 0} ledger · {formatHUF(spent)}/{formatHUF(t.amount)}
            </span>
            <span className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <span
                className={classNames(
                  'block h-full rounded-full transition-all',
                  progress > 100 ? 'bg-rose-500' : progress > 90 ? 'bg-amber-500' : 'bg-primary',
                )}
                style={{ width: `${progress}%` }}
              />
            </span>
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
          return (
            <StatusPill status={t.paidDate ? 'success' : 'warning'} size="xs" dot>
              {t.paidDate ? 'kész' : 'függőben'}
            </StatusPill>
          );
        }
        const isOverdue = !t.paidDate && t.dueDate < today;
        const statusLabel = t.paidDate
          ? `Kifizetve (${formatDate(t.paidDate)}) — kattints visszaállításhoz`
          : isOverdue
            ? 'Lejárt — kattints kifizetettként jelöléshez'
            : 'Függőben — kattints kifizetettként jelöléshez';
        return (
          <StatusToggleButton
            status={t.paidDate ? 'success' : isOverdue ? 'danger' : 'warning'}
            title={statusLabel}
            pending={isTxPending(t.id as number)}
            onClick={() =>
              void wrapTxPending(t.id as number, () =>
                updateTransaction(t.id as number, {
                  paidDate: t.paidDate ? null : new Date().toISOString().split('T')[0],
                }),
              )
            }
          >
            {t.paidDate ? (
              <>
                <CheckCircle size={9} /> {formatDate(t.paidDate)}
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
          <div className="flex items-center justify-end gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => openTxForm(t as unknown as CashTransaction)}
            >
              <Edit3 size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() =>
                requestDelete({
                  title: 'Tétel törlése',
                  message: `Biztosan törlöd a „${t.description}" tételt? Ez a művelet nem vonható vissza.`,
                  onConfirm: () => deleteTransaction(t.id as number),
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
