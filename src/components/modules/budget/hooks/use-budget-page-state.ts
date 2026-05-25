import { useEffect } from 'react';
import { useBudgetStore, isWalletTransactionsReady } from '@/stores/useBudgetStore';
import { useBudgetUiStore } from '@/stores/useBudgetUiStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { formatHUF, today as todayDate, isDueOverdue, hasSettlementDate } from '@/utils';
import { LedgerEntry, UtilityBill, CashTransaction } from '@/types';
import { isLegacySettlementBill } from '@/lib/utilityBills';
import { HELP } from '@/lib/helpTexts';
import { isUtilityHouseholdSide, ourUtilityPortion } from '@/lib/utilityViewer';
import { resolveActiveWallet } from '@/lib/walletBalance';
import { canUseFeature } from '@/lib/checkAccess';
import { isHouseholdReader } from '@/lib/householdRole';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useAsyncAction, usePendingIds } from '@/hooks/useAsyncAction';
import { AlertCircle, ReceiptText, TrendingUp } from 'lucide-react';
import type { MetricItem } from '@/components/design';

export function useBudgetPageState() {
  const {
    transactions,
    goalBudgetRows,
    deleteTransaction,
    updateTransaction,
    aiOverspend,
    fetchAiOverspend,
    fetchAiCashflowForecast,
    clonePreviousMonth,
    categories,
    fetchTransactions,
    fetchGoalRows,
    loadedWalletId,
    loadedMonth,
    loadedYear,
    isLoading: walletLoading,
    isLoadingGoals,
  } = useBudgetStore();

  const ui = useBudgetUiStore();
  const { user } = useAuthStore();
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const { bills } = useUtilitiesStore();
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const { pending: cloning, run: runClone } = useAsyncAction();
  const { wrap: wrapTxPending, isPending: isTxPending } = usePendingIds();

  const utilitySplitConfigured =
    user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? false;
  const utilitySplitEnabled = utilitySplitConfigured && canUseFeature(user, 'utility_split');
  const canUseAi = canUseFeature(user, 'ai');
  const isReader = isHouseholdReader(user);
  const partnerId = user?.household?.utilitySplitPartnerId ?? user?.household?.utility_split_partner_id;
  const onHouseholdSide = isUtilityHouseholdSide(user?.id, partnerId);
  const getBillPortion = (b: UtilityBill) => ourUtilityPortion(b, onHouseholdSide, utilitySplitEnabled);

  useEffect(() => {
    if (!canUseAi || activeWalletId === null) return;
    if (loadedWalletId !== activeWalletId) return;
    fetchAiOverspend(selectedYear, selectedMonth, activeWalletId);
    fetchAiCashflowForecast(selectedYear, selectedMonth, activeWalletId);
  }, [activeWalletId, canUseAi, fetchAiCashflowForecast, fetchAiOverspend, loadedWalletId, selectedMonth, selectedYear]);

  useEffect(() => {
    if (activeWalletId === null) return;
    if (isWalletTransactionsReady(activeWalletId, loadedWalletId, walletLoading)) return;
    void fetchTransactions(activeWalletId);
  }, [activeWalletId, fetchTransactions, loadedWalletId, walletLoading]);

  useEffect(() => {
    if (activeWalletId === null) return;
    if (loadedWalletId !== activeWalletId) return;
    if (
      loadedMonth === selectedMonth &&
      loadedYear === selectedYear &&
      !isLoadingGoals
    ) {
      return;
    }
    void fetchGoalRows(activeWalletId, selectedMonth, selectedYear);
  }, [
    activeWalletId,
    fetchGoalRows,
    isLoadingGoals,
    loadedWalletId,
    loadedMonth,
    loadedYear,
    selectedMonth,
    selectedYear,
  ]);

  useEffect(() => {
    if (activeWalletId === null) return;
    const wallet = resolveActiveWallet(user, activeWalletId);
    useBudgetUiStore.getState().syncManualBalanceFromDb(wallet?.manualBalance ?? 0);
  }, [activeWalletId, user?.wallets]);

  const selectedYearMonth = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
  const goalsReady =
    loadedMonth === selectedMonth && loadedYear === selectedYear && !isLoadingGoals;
  const activeGoalRows = goalsReady ? goalBudgetRows : [];
  const allMonthTransactions = transactions.filter((t) => t.dueDate.startsWith(selectedYearMonth));
  const reserves = allMonthTransactions.filter((t) => t.isReserve);
  const incomes = allMonthTransactions.filter((t) => t.type === 'income' && !t.isReserve);
  const expenses = [
    ...allMonthTransactions.filter((t) => t.type === 'expense' && !t.isReserve),
    ...activeGoalRows,
  ];
  const monthlyBills = bills.filter(
    (b) => b.dueDate.startsWith(selectedYearMonth) && !isLegacySettlementBill(b),
  );

  const totalIncomeReceived = incomes.filter((t) => hasSettlementDate(t.paidDate)).reduce((s, t) => s + t.amount, 0);

  const totalActualSpent =
    expenses.reduce((s, t) => {
      if (t.isBudget && t.subItems && t.subItems.length > 0) {
        return s + t.subItems.reduce((acc: number, si: LedgerEntry) => acc + Math.abs(si.amount), 0);
      }
      return s + (hasSettlementDate(t.paidDate) ? t.amount : 0);
    }, 0) + monthlyBills.filter((b) => hasSettlementDate(b.paidDate)).reduce((s, b) => s + getBillPortion(b), 0);

  const totalProjectedExpense =
    expenses.reduce((s, t) => s + t.amount, 0) + monthlyBills.reduce((s, b) => s + getBillPortion(b), 0);

  const unpaidExpenses =
    expenses
      .filter((t) => !hasSettlementDate(t.paidDate))
      .reduce((s, t) => {
        if (t.isBudget) {
          const spent = t.subItems ? t.subItems.reduce((acc: number, si: LedgerEntry) => acc + Math.abs(si.amount), 0) : 0;
          return s + Math.max(0, t.amount - spent);
        }
        return s + t.amount;
      }, 0) + monthlyBills.filter((b) => !hasSettlementDate(b.paidDate)).reduce((s, b) => s + getBillPortion(b), 0);

  const unpaidReserves = reserves.filter((t) => !hasSettlementDate(t.paidDate)).reduce((s, t) => s + Math.abs(t.amount), 0);
  const projectedFinalLiquidAssets = Number(ui.manualBalance) - unpaidExpenses - unpaidReserves;

  const today = todayDate();
  const overdueExpenses =
    expenses.filter((t) => isDueOverdue(t, today)).reduce((s, t) => s + t.amount, 0) +
    monthlyBills.filter((b) => isDueOverdue(b, today)).reduce((s, b) => s + getBillPortion(b), 0);

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

  const summaryMetrics: MetricItem[] = [
    {
      label: 'Tervezett keret',
      value: formatHUF(totalProjectedExpense),
      tone: 'default',
    },
    {
      label: 'Már kifizetve',
      value: formatHUF(totalActualSpent),
      tone: 'warning',
    },
    {
      label: 'Befolyt bevétel',
      value: formatHUF(totalIncomeReceived),
      tone: 'success',
    },
    {
      label: 'Havi egyenleg',
      value: formatHUF(totalIncomeReceived - totalActualSpent),
      tone: totalIncomeReceived - totalActualSpent < 0 ? 'danger' : 'primary',
    },
  ];

  const activeLedgerItems =
    transactions.find((t) => t.id === ui.activeTxId)?.subItems ??
    activeGoalRows.find((t) => t.id === ui.activeTxId)?.subItems;

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
    openTxForm: (tx?: Parameters<typeof ui.openTxForm>[0], defaultType?: 'income' | 'expense') => {
      if (isReader) return;
      ui.openTxForm(tx, defaultType, categories);
    },
    manualBalance: ui.manualBalance,
    setManualBalance: ui.setManualBalance,
    balanceSaved: ui.balanceSaved,
    setBalanceSaved: ui.setBalanceSaved,
    balanceSaving: ui.balanceSaving,
    handleManualBalanceSave: ui.handleManualBalanceSave,
    isReader,
    walletLoading,
    isLoadingGoals,
    walletDataReady: isWalletTransactionsReady(activeWalletId, loadedWalletId, walletLoading),
    goalsDataReady: goalsReady,
    gridLoading:
      !isWalletTransactionsReady(activeWalletId, loadedWalletId, walletLoading) || isLoadingGoals,
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
    setActiveTxId: ui.setActiveTxId,
    setIsLedgerModalOpen: ui.setIsLedgerModalOpen,
    openGoalPaymentModal: (goalRow: CashTransaction) => {
      if (isReader) return;
      ui.openGoalPaymentModal(goalRow);
    },
    ledgerIsGoalPayment: ui.ledgerIsGoalPayment,
    ledgerGoalTitle: ui.ledgerGoalTitle,
    openLedgerModal: (txId: number | string) => {
      if (isReader) return;
      ui.openLedgerModal(txId);
    },
    isTxModalOpen: ui.isTxModalOpen,
    setIsTxModalOpen: ui.setIsTxModalOpen,
    editTxId: ui.editTxId,
    txType: ui.txType,
    setTxType: ui.setTxType,
    txCat: ui.txCat,
    setTxCat: ui.setTxCat,
    txDesc: ui.txDesc,
    setTxDesc: ui.setTxDesc,
    txAmount: ui.txAmount,
    setTxAmount: ui.setTxAmount,
    txDue: ui.txDue,
    setTxDue: ui.setTxDue,
    txIsBudget: ui.txIsBudget,
    setTxIsBudget: ui.setTxIsBudget,
    txIsReserve: ui.txIsReserve,
    setTxIsReserve: ui.setTxIsReserve,
    handleTxSubmit: ui.handleTxSubmit,
    handleAutoCategory: ui.handleAutoCategory,
    isCategoryLoading: ui.isCategoryLoading,
    isLedgerModalOpen: ui.isLedgerModalOpen,
    closeLedgerModal: ui.closeLedgerModal,
    ledgerAmount: ui.ledgerAmount,
    setLedgerAmount: ui.setLedgerAmount,
    ledgerReason: ui.ledgerReason,
    setLedgerReason: ui.setLedgerReason,
    handleLedgerSubmit: ui.handleLedgerSubmit,
    activeLedgerItems,
    ConfirmDeleteModal,
  };
}

export type BudgetPageState = ReturnType<typeof useBudgetPageState>;
