'use client';

import { useEffect, useState } from 'react';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { formatHUF } from '@/utils';
import { aiFinanceClient } from '@/lib/api-client';
import { CashTransaction, LedgerEntry, UtilityBill } from '@/types';
import { isLegacySettlementBill } from '@/lib/utilityBills';
import { HELP } from '@/lib/helpTexts';
import { isUtilityHouseholdSide, ourUtilityPortion } from '@/lib/utilityViewer';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useAsyncAction, usePendingIds } from '@/hooks/useAsyncAction';
import { AlertCircle, ReceiptText, TrendingUp } from 'lucide-react';
import type { MetricItem } from '@/components/design';

export function useBudgetPageState() {
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
  const utilitySplitEnabled = user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? false;
  const partnerId = user?.household?.utilitySplitPartnerId ?? user?.household?.utility_split_partner_id;
  const onHouseholdSide = isUtilityHouseholdSide(user?.id, partnerId);
  const getBillPortion = (b: UtilityBill) => ourUtilityPortion(b, onHouseholdSide, utilitySplitEnabled);
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const { pending: cloning, run: runClone } = useAsyncAction();
  const { wrap: wrapTxPending, isPending: isTxPending } = usePendingIds();

  useEffect(() => {
    fetchAiOverspend(selectedYear, selectedMonth);
  }, [fetchAiOverspend, selectedMonth, selectedYear]);

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

  const summaryMetrics: Array<{ label: string; value: string; tone: string; bar: string }> = [
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
  ];

  const handleLedgerSubmit = () => {
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
  };

  const closeLedgerModal = () => {
    setIsLedgerModalOpen(false);
    setActiveTxId(null);
  };

  const activeLedgerItems = transactions.find((t) => t.id === activeTxId)?.subItems;

  return {
    transactions,
    categories,
    deleteTransaction,
    updateTransaction,
    clonePreviousMonth,
    selectedMonth,
    selectedYear,
    cloning,
    runClone,
    openTxForm,
    manualBalance,
    setManualBalance,
    balanceSaved,
    setBalanceSaved,
    balanceSaving,
    handleManualBalanceSave,
    cashflowMetrics,
    aiOverspend,
    summaryMetrics,
    categoryData,
    totalProjectedExpense,
    incomes,
    expenses,
    reserves,
    monthlyBills,
    getBillPortion,
    today,
    requestDelete,
    wrapTxPending,
    isTxPending,
    setActiveTxId,
    setIsLedgerModalOpen,
    isTxModalOpen,
    setIsTxModalOpen,
    editTxId,
    txType,
    setTxType,
    txCat,
    setTxCat,
    txDesc,
    setTxDesc,
    txAmount,
    setTxAmount,
    txDue,
    setTxDue,
    txIsBudget,
    setTxIsBudget,
    txIsReserve,
    setTxIsReserve,
    handleTxSubmit,
    handleAutoCategory,
    isCategoryLoading,
    isLedgerModalOpen,
    closeLedgerModal,
    ledgerAmount,
    setLedgerAmount,
    ledgerReason,
    setLedgerReason,
    handleLedgerSubmit,
    activeLedgerItems,
    ConfirmDeleteModal,
  };
}

export type BudgetPageState = ReturnType<typeof useBudgetPageState>;
