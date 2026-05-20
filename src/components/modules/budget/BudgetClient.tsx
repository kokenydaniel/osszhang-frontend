'use client';

import React, { useEffect, useState } from 'react';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { formatHUF, formatDate } from '@/utils';
import { aiFinanceClient } from '@/api';
import { CashTransaction, LedgerEntry, UtilityBill } from '@/types';
import { isLegacySettlementBill } from '@/lib/utilityBills';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { FieldHint } from '@/components/ui/FieldHint';
import { FormChoiceCard } from '@/components/ui/FormChoiceCard';
import { HELP } from '@/lib/helpTexts';
import { cn } from '@/lib/utils';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useAsyncAction, usePendingIds } from '@/hooks/useAsyncAction';
import { motion } from 'motion/react';
import {
  PageHeader,
  SegmentedControl,
  MetricStrip,
  DataTable,
  Section,
  AccentPanel,
  StatusPill,
  StatusToggleButton,
  EmptyState,
  type MetricItem,
  type DataTableColumn,
} from '@/components/design';
import {
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  Clock,
  Folder,
  Wallet,
  PiggyBank,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Bot,
  ReceiptText,
  Building2,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  Calendar,
  Tag,
  Pencil,
  Check,
} from 'lucide-react';

export default function BudgetClient() {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    addSubItem,
    aiOverspend,
    fetchAiOverspend,
    clonePreviousMonth,
    categories,
  } = useBudgetStore();

  const { bills } = useUtilitiesStore();
  const { user, updateManualBalance } = useAuthStore();
  const utilitySplitEnabled = user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? true;
  const getBillPortion = (b: UtilityBill) => {
    if (!utilitySplitEnabled) return b.total;
    return b.splitRule === 'shared' ? b.total / 2 : b.splitRule === 'dani-private' ? b.total : 0;
  };
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const { pending: cloning, run: runClone } = useAsyncAction();
  const { wrap: wrapTxPending, isPending: isTxPending } = usePendingIds();

  useEffect(() => {
    fetchAiOverspend(selectedYear, selectedMonth);
  }, [fetchAiOverspend, selectedMonth, selectedYear]);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editTxId, setEditTxId] = useState<number | null>(null);
  const [txType, setTxType] = useState<'expense' | 'income'>('income');
  const [txCat, setTxCat] = useState(categories[0] || '');
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDue, setTxDue] = useState(new Date().toISOString().split('T')[0]);
  const [txIsBudget, setTxIsBudget] = useState(false);
  const [txIsReserve, setTxIsReserve] = useState(false);
  const [txPaidDate, setTxPaidDate] = useState<string | null>(null);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [activeTxId, setActiveTxId] = useState<number | null>(null);
  const [ledgerAmount, setLedgerAmount] = useState('');
  const [ledgerReason, setLedgerReason] = useState('');

  const [manualBalance, setManualBalance] = useState<string>('0');
  const [balanceSaved, setBalanceSaved] = useState(false);
  const [balanceSaving, setBalanceSaving] = useState(false);

  useEffect(() => {
    const dbVal = user?.household?.manualBalance ?? user?.household?.manual_balance ?? 0;
    setManualBalance(dbVal.toString());
  }, [user?.household?.manualBalance, user?.household?.manual_balance]);

  const handleManualBalanceSave = async () => {
    setBalanceSaving(true);
    try {
      await updateManualBalance(Number(manualBalance) || 0);
      setBalanceSaved(true);
      window.setTimeout(() => setBalanceSaved(false), 2000);
    } finally {
      setBalanceSaving(false);
    }
  };

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = txAmount.toString().replace(',', '.');
    const data = {
      type: txType,
      description: txDesc,
      category: txCat,
      amount: Number(cleanAmount),
      dueDate: txDue,
      isBudget: txIsBudget,
      isReserve: txIsReserve,
      paidDate: txPaidDate,
    };
    if (editTxId) updateTransaction(editTxId, data);
    else addTransaction(data);
    setIsTxModalOpen(false);
  };

  const handleAutoCategory = async () => {
    if (!txDesc.trim()) return;
    setIsCategoryLoading(true);
    try {
      const res = await aiFinanceClient.autoCategorizeTransaction({
        description: txDesc,
        type: txType,
        amount: txAmount ? Number(txAmount) : undefined,
        candidate_categories: categories,
      });
      const category = res.data?.data?.category;
      if (category) setTxCat(category);
    } finally {
      setIsCategoryLoading(false);
    }
  };

  const openTxForm = (tx?: CashTransaction | null, defaultType: 'income' | 'expense' = 'expense') => {
    if (tx) {
      setEditTxId(tx.id);
      setTxType(tx.type);
      setTxCat(tx.category);
      setTxDesc(tx.description);
      setTxAmount(tx.amount.toString());
      setTxDue(tx.dueDate);
      setTxIsBudget(tx.isBudget || false);
      setTxIsReserve(tx.isReserve || false);
      setTxPaidDate(tx.paidDate || null);
    } else {
      setEditTxId(null);
      setTxType(defaultType);
      setTxCat(categories[0]);
      setTxDesc('');
      setTxAmount('');
      setTxDue(new Date().toISOString().split('T')[0]);
      setTxIsBudget(false);
      setTxIsReserve(false);
      setTxPaidDate(null);
    }
    setIsTxModalOpen(true);
  };

  const selectedYearMonth = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
  const allMonthTransactions = transactions.filter((t) => t.dueDate.startsWith(selectedYearMonth));
  const reserves = allMonthTransactions.filter((t) => t.isReserve);
  const incomes = allMonthTransactions.filter((t) => t.type === 'income' && !t.isReserve);
  const expenses = allMonthTransactions.filter((t) => t.type === 'expense' && !t.isReserve);
  const monthlyBills = bills.filter(
    (b) => b.dueDate.startsWith(selectedYearMonth) && !isLegacySettlementBill(b),
  );

  const totalIncomeReceived = incomes.filter((t) => !!t.paidDate).reduce((s, t) => s + t.amount, 0);

  const totalActualSpent =
    expenses.reduce((s, t) => {
      if (t.isBudget && t.subItems && t.subItems.length > 0) {
        return s + t.subItems.reduce((acc: number, si: LedgerEntry) => acc + Math.abs(si.amount), 0);
      }
      return s + (t.paidDate ? t.amount : 0);
    }, 0) + monthlyBills.filter((b) => !!b.paidDate).reduce((s, b) => s + getBillPortion(b), 0);

  const totalProjectedExpense =
    expenses.reduce((s, t) => s + t.amount, 0) + monthlyBills.reduce((s, b) => s + getBillPortion(b), 0);

  const unpaidExpenses =
    expenses
      .filter((t) => !t.paidDate)
      .reduce((s, t) => {
        if (t.isBudget) {
          const spent = t.subItems ? t.subItems.reduce((acc: number, si: LedgerEntry) => acc + Math.abs(si.amount), 0) : 0;
          return s + Math.max(0, t.amount - spent);
        }
        return s + t.amount;
      }, 0) + monthlyBills.filter((b) => !b.paidDate).reduce((s, b) => s + getBillPortion(b), 0);

  const unpaidReserves = reserves.filter((t) => !t.paidDate).reduce((s, t) => s + Math.abs(t.amount), 0);
  const projectedFinalLiquidAssets = Number(manualBalance) - unpaidExpenses - unpaidReserves;

  const today = new Date().toISOString().split('T')[0];
  const overdueExpenses =
    expenses.filter((t) => !t.paidDate && t.dueDate < today).reduce((s, t) => s + t.amount, 0) +
    monthlyBills.filter((b) => !b.paidDate && b.dueDate < today).reduce((s, b) => s + getBillPortion(b), 0);

  const allExpenseCategories = Array.from(new Set([...categories, ...expenses.map((e) => e.category || 'Egyéb')]));
  const categoryData = allExpenseCategories
    .map((name) => {
      const amt = expenses.filter((e) => (e.category || 'Egyéb') === name).reduce((s, e) => s + e.amount, 0);
      const billAmt = name === 'Rezsi' ? monthlyBills.reduce((s, b) => s + getBillPortion(b), 0) : 0;
      return { name, value: amt + billAmt };
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  interface TableItem {
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

  const groupedFeed = (
    items: CashTransaction[],
    type: 'income' | 'expense',
    includeBills = false,
  ): Record<string, TableItem[]> => {
    const allCats = Array.from(new Set([...categories, ...items.map((i) => i.category || 'Egyéb')]));
    const grouped = allCats.reduce((acc, cat) => {
      let filtered: TableItem[] = items
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
        const billItems: TableItem[] = monthlyBills
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
    }, {} as Record<string, TableItem[]>);
    return grouped;
  };

  const cashflowMetrics: MetricItem[] = [
    {
      label: 'Fizetendő',
      value: formatHUF(unpaidExpenses),
      info: HELP.budget.payable,
      hint: 'Ebben a hónapban',
      icon: ReceiptText,
      tone: unpaidExpenses > 0 ? 'warning' : 'success',
    },
    {
      label: 'Marad',
      value: formatHUF(projectedFinalLiquidAssets),
      info: HELP.budget.remaining,
      hint: 'Egyenleg − fizetendő',
      icon: TrendingUp,
      tone: projectedFinalLiquidAssets >= 0 ? 'success' : 'danger',
      emphasis: true,
    },
    {
      label: 'Lejárt',
      value: formatHUF(overdueExpenses),
      info: HELP.budget.overdue,
      hint: overdueExpenses > 0 ? 'Sürgős!' : 'Nincs lejárt',
      icon: AlertCircle,
      tone: overdueExpenses > 0 ? 'danger' : 'default',
    },
  ];

  const renderFeed = (
    items: CashTransaction[],
    title: string,
    type: 'income' | 'expense',
    includeBills = false,
  ) => {
    const grouped = groupedFeed(items, type, includeBills);
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

    const columns: DataTableColumn<TableItem & { _category: string }>[] = [
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
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', toneCls)}>
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
              className={cn(
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
                  className={cn(
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
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  type === 'income' ? 'text-emerald-600' : 'text-foreground',
                )}
              >
                {type === 'income' ? '+' : '−'} {formatHUF(t.amount)}
              </span>
              {t.isBudget && (
                <span
                  className={cn(
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
  };

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1500px] mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Pénzügyek' }, { label: 'Költségvetés' }]}
        title="Cashflow"
        description="Bevételek, kiadások és tárgyhavi rezsi — egy nézetben."
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              loading={cloning}
              onClick={() => void runClone(() => clonePreviousMonth(selectedMonth, selectedYear))}
            >
              {!cloning && <Copy size={13} />} {cloning ? 'Másolás…' : 'Múlt havi'}
            </Button>
            <Button size="sm" onClick={() => openTxForm(null)}>
              <Plus size={13} /> Új tétel
            </Button>
          </>
        }
      />

      {/* Top: editable balance + metrics side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 shadow-glow"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-violet-500 to-primary" />
          <FieldLabel info={HELP.budget.manualBalance} className="text-primary">
            <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wider">
              <Wallet size={11} /> Aktuális egyenleg
            </span>
          </FieldLabel>
          <div className="relative mt-3">
            <Input
              type="number"
              inputMode="numeric"
              value={manualBalance}
              onChange={(e) => {
                setManualBalance(e.target.value);
                setBalanceSaved(false);
              }}
              onBlur={handleManualBalanceSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleManualBalanceSave();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              disabled={balanceSaving}
              className="h-12 pr-14 text-2xl font-bold tabular-nums bg-card/80 border-primary/20 focus-visible:ring-primary/30"
              placeholder="0"
              aria-label="Aktuális egyenleg forintban"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              Ft
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Pencil size={11} strokeWidth={2.2} />
              Bankszámla / készpénz
            </span>
            {balanceSaving ? (
              <span>Mentés…</span>
            ) : balanceSaved ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <Check size={11} strokeWidth={2.5} /> Mentve
              </span>
            ) : null}
          </div>
        </motion.div>
        <MetricStrip items={cashflowMetrics} columns={3} variant="separated" />
      </div>

      {aiOverspend && (
        <AccentPanel
          tone={aiOverspend?.status === 'overspent' ? 'warning' : 'success'}
          icon={Bot}
          title={
            aiOverspend?.status === 'overspent' ? (
              <span>
                AI túlköltés érzékelve:{' '}
                {typeof aiOverspend?.overspend_amount === 'number' ? formatHUF(aiOverspend.overspend_amount) : ''}
              </span>
            ) : (
              'AI túlköltés ellenőrzés: rendben'
            )
          }
          description="Modell alapú elemzés a tárgyhavi költésekről"
          titleInfo={HELP.budget.aiOverspend}
        >
          {!!aiOverspend?.top_drivers?.length && (
            <div className="flex flex-wrap gap-1.5">
              {aiOverspend.top_drivers.map((d: { category: string; amount: number }) => (
                <span
                  key={d.category}
                  className="inline-flex items-center gap-1 rounded-md bg-card border border-border px-2 py-1 text-[0.7rem] shadow-sm"
                >
                  <Tag size={9} strokeWidth={2.2} className="text-muted-foreground" />
                  <span className="text-muted-foreground">{d.category}:</span>
                  <span className="font-semibold tabular-nums text-foreground">{formatHUF(d.amount)}</span>
                </span>
              ))}
            </div>
          )}
        </AccentPanel>
      )}

      {/* Summary strip */}
      <div className="rounded-lg border border-border bg-card grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border overflow-hidden shadow-soft">
        {[
          {
            label: 'Tervezett keret',
            value: formatHUF(totalProjectedExpense),
            tone: '',
            bar: 'bg-muted-foreground/20',
          },
          {
            label: 'Már kifizetve',
            value: formatHUF(totalActualSpent),
            tone: '',
            bar: 'bg-amber-500',
          },
          {
            label: 'Befolyt bevétel',
            value: formatHUF(totalIncomeReceived),
            tone: 'text-emerald-600',
            bar: 'bg-emerald-500',
          },
          {
            label: 'Havi egyenleg',
            value: formatHUF(totalIncomeReceived - totalActualSpent),
            tone: totalIncomeReceived - totalActualSpent < 0 ? 'text-rose-600' : 'text-primary',
            bar:
              totalIncomeReceived - totalActualSpent < 0
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-primary to-violet-500',
          },
        ].map((m) => (
          <div key={m.label} className="relative px-4 py-3.5 group hover:bg-muted/30 transition-colors">
            <span
              className={cn(
                'absolute inset-y-0 left-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity',
                m.bar,
              )}
            />
            <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">{m.label}</p>
            <p
              className={cn(
                'text-base lg:text-lg font-semibold tabular-nums mt-1 tracking-tight',
                m.tone || 'text-foreground',
              )}
            >
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main grid: category breakdown rail + feed */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <Section title="Kategória összegzés" info={HELP.budget.categorySummary} description="Tárgyhavi kiadások">
          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-soft">
            {categoryData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 px-4">Még nincs adat.</p>
            ) : (
              <>
                {categoryData.map((c, i) => {
                  const maxValue = Math.max(...categoryData.map((d) => d.value));
                  const progress = maxValue > 0 ? (c.value / maxValue) * 100 : 0;
                  return (
                    <div
                      key={c.name}
                      className={cn('px-4 py-3 group hover:bg-muted/30 transition-colors', i > 0 && 'border-t border-border')}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-medium text-foreground inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {c.name}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-foreground">{formatHUF(c.value)}</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center px-4 py-3 border-t-2 border-border bg-muted/40">
                  <span className="text-[0.7rem] font-semibold uppercase tracking-wider">Összesen</span>
                  <span className="text-sm font-semibold text-gradient tabular-nums">{formatHUF(totalProjectedExpense)}</span>
                </div>
              </>
            )}
          </div>
        </Section>

        <div className="flex flex-col gap-7">
          {renderFeed(incomes, 'Bevételek', 'income')}
          {reserves.length > 0 && renderFeed(reserves, 'Tartalékok', 'expense')}
          {renderFeed(expenses, 'Kiadások', 'expense', true)}
        </div>
      </div>

      {/* TRANSACTION MODAL */}
      <Modal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        title={editTxId ? 'Tétel szerkesztése' : 'Új tétel'}
        description={HELP.budget.txTypeIntro}
        contentKey={`${txType}-${txIsBudget}-${txIsReserve}`}
      >
        <form onSubmit={handleTxSubmit} className="flex flex-col gap-4">
          <SegmentedControl
            variant="choice"
            value={txType}
            onChange={(v) => {
              const next = v as 'income' | 'expense';
              setTxType(next);
              if (next === 'income') setTxIsBudget(false);
              else setTxIsReserve(false);
            }}
            options={[
              {
                value: 'income',
                label: 'Bevétel',
                icon: ArrowUpRight,
                tone: 'positive',
                description: 'Fizetés, visszatérítés, bevétel',
              },
              {
                value: 'expense',
                label: 'Kiadás',
                icon: ArrowDownRight,
                tone: 'negative',
                description: 'Költség, rezsi, vásárlás',
              },
            ]}
            animated={false}
          />

          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">
              {txType === 'expense' ? 'Kiadás típusa' : 'Bevétel típusa'}
            </p>
            <FieldHint className="-mt-1 mb-1">
              {txType === 'expense'
                ? 'Normál kiadás = azonnal cashflow. Saját keret = előbb keret, költést később ledgerrel.'
                : 'Normál bevétel = növeli a költhető egyenleget. Tartalék = félretett összeg, nem cashflow.'}
            </FieldHint>
            {txType === 'expense' ? (
              <div className="grid gap-2" role="radiogroup" aria-label="Kiadás típusa">
                <FormChoiceCard
                  selected={!txIsBudget}
                  onSelect={() => setTxIsBudget(false)}
                  title="Normál kiadás (cashflow)"
                  description={HELP.budget.expenseNormal}
                  example="Lidl, benzín, előfizetés"
                  icon={ReceiptText}
                />
                <FormChoiceCard
                  selected={txIsBudget}
                  onSelect={() => setTxIsBudget(true)}
                  title="Saját keret (ledger)"
                  description={HELP.budget.expenseLedger}
                  example="Heti bevásárlás 80 000 Ft keret"
                  icon={Wallet}
                />
              </div>
            ) : (
              <div className="grid gap-2" role="radiogroup" aria-label="Bevétel típusa">
                <FormChoiceCard
                  selected={!txIsReserve}
                  onSelect={() => setTxIsReserve(false)}
                  title="Bevétel (cashflow)"
                  description={HELP.budget.incomeNormal}
                  example="Fizetés, visszatérítés"
                  icon={ArrowUpRight}
                />
                <FormChoiceCard
                  selected={txIsReserve}
                  onSelect={() => setTxIsReserve(true)}
                  title="Tartalék"
                  badge="Nem cashflow"
                  description={HELP.budget.incomeReserve}
                  example="Állampapírra félretett összeg ebben a hónapban"
                  icon={PiggyBank}
                  warning={HELP.budget.reserveWarning}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <FieldLabel info={HELP.budget.description} hint="Rövid név — később is felismerhető legyen a listában.">
              Leírás
            </FieldLabel>
            <Input
              placeholder="pl. Heti bevásárlás"
              value={txDesc}
              onChange={(e) => setTxDesc(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel info={HELP.budget.category} hint="A kategória összesítőben és az AI elemzésben is megjelenik.">
              Kategória
            </FieldLabel>
            <div className="flex gap-2">
              <select
                className="h-9 flex-1 rounded-md border border-border bg-input px-3 text-sm appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 outline-none"
                value={txCat}
                onChange={(e) => setTxCat(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoCategory}
                disabled={isCategoryLoading || !txDesc.trim()}
              >
                {isCategoryLoading ? <RefreshCw size={13} className="animate-spin" /> : <Bot size={13} />}
                Auto
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel
                info={HELP.budget.amount}
                hint={
                  txType === 'expense' && txIsBudget
                    ? 'Ez a keret plafon — nem egyetlen azonnali kiadás.'
                    : txType === 'income' && txIsReserve
                      ? 'Félretett összeg — nem növeli automatikusan a „Marad” mutatót.'
                      : undefined
                }
              >
                Összeg (Ft)
              </FieldLabel>
              <Input
                type="number"
                placeholder="0"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                required
                step="any"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel info={HELP.budget.date} hint="Esedékesség vagy a tranzakció napja.">
                Dátum
              </FieldLabel>
              <DatePicker value={txDue} onChange={setTxDue} />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsTxModalOpen(false)}>
              Mégse
            </Button>
            <Button type="submit" className="flex-1">
              Mentés
            </Button>
          </div>
        </form>
      </Modal>

      {/* BUDGET LEDGER MODAL */}
      <Modal
        isOpen={isLedgerModalOpen}
        onClose={() => {
          setIsLedgerModalOpen(false);
          setActiveTxId(null);
        }}
        title="Költés rögzítése (ledger)"
        description={HELP.budget.ledgerModalIntro}
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <FieldLabel
              info={HELP.budget.ledgerAmount}
              hint="Egy konkrét vásárlás / költés összege — összeadódik a „felhasználva” sávban."
            >
              Összeg (felhasznált)
            </FieldLabel>
            <Input
              type="number"
              placeholder="0"
              value={ledgerAmount}
              onChange={(e) => setLedgerAmount(e.target.value)}
              step="any"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel info={HELP.budget.ledgerNote} hint="pl. „Aldi 12.450 Ft” — később visszakereshető.">
              Megjegyzés
            </FieldLabel>
            <Input
              placeholder="pl. Heti bevásárlás"
              value={ledgerReason}
              onChange={(e) => setLedgerReason(e.target.value)}
            />
          </div>

          <Button
            onClick={() => {
              if (!activeTxId) return;
              const cleanAmount = ledgerAmount.replace(',', '.');
              const amt = -Math.abs(Number(cleanAmount));
              addSubItem(activeTxId, {
                date: new Date().toISOString().split('T')[0],
                amount: amt,
                reason: ledgerReason,
              });
              setLedgerAmount('');
              setLedgerReason('');
            }}
          >
            <Plus size={13} /> Rögzítés
          </Button>

          <div className="border-t border-border pt-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Korábbi tételek
            </p>
            <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto">
              {(() => {
                const items = transactions.find((t) => t.id === activeTxId)?.subItems;
                if (!items || items.length === 0) {
                  return <p className="text-xs text-muted-foreground text-center py-4">Még nincsenek tételek.</p>;
                }
                return items
                  .slice()
                  .reverse()
                  .map((item: LedgerEntry) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center bg-muted/40 border border-border rounded-md px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.reason}</p>
                        <p className="text-[0.7rem] text-muted-foreground tabular-nums">{formatDate(item.date)}</p>
                      </div>
                      <p
                        className={cn(
                          'text-sm font-semibold tabular-nums',
                          item.amount >= 0 ? 'text-emerald-600' : 'text-rose-600',
                        )}
                      >
                        {item.amount >= 0 ? '+' : ''}
                        {formatHUF(item.amount)}
                      </p>
                    </div>
                  ));
              })()}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal />
    </div>
  );
}
