import { useCallback, useEffect, useMemo } from 'react';
import { useBudgetStore, isWalletTransactionsReady } from '@/stores/useBudgetStore';
import { useBudgetUi } from '../BudgetUiContext';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore, getActiveWalletId } from '@/stores/useWalletStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { formatHUF, today as todayDate } from '@/utils';
import { UtilitiesService } from '@/services/UtilitiesService';
import { HELP } from '@/lib/helpTexts';
import { resolveActiveWallet } from '@/lib/walletBalance';
import { canUseFeature } from '@/lib/checkAccess';
import { isHouseholdReader, canEditHousehold } from '@/lib/householdRole';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useAsyncAction, usePendingIds } from '@/hooks/useAsyncAction';
import { AlertCircle, ReceiptText, TrendingUp } from 'lucide-react';
import type { MetricItem } from '@/components/design';
import { BudgetService } from '@/services/BudgetService';
import { AiFinanceService } from '@/services/AiFinanceService';
import { ensureBudgetPeriodLoaded } from '@/lib/budgetDataLoader';
import { ensureBudgetAiInsightsLoaded } from '@/lib/budgetAiInsightsLoader';
import { syncSavingsForWallet } from '@/lib/walletDataSync';
import { isAbortError } from '@/lib/api-client/abortError';
import { isSavingsGoalTransaction, CashTransaction } from '@/types';
import { useBudgetCashflowMetrics } from '@/hooks/useBudgetCashflowMetrics';

export function useBudgetLogicState() {
  const transactions = useBudgetStore((s) => s.transactions);
  const goalBudgetRows = useBudgetStore((s) => s.goalBudgetRows);
  const categories = useBudgetStore((s) => s.categories);
  const aiOverspend = useBudgetStore((s) => s.aiOverspend);
  const aiCashflowForecast = useBudgetStore((s) => s.aiCashflowForecast);
  const loadedWalletId = useBudgetStore((s) => s.loadedWalletId);
  const loadedMonth = useBudgetStore((s) => s.loadedMonth);
  const loadedYear = useBudgetStore((s) => s.loadedYear);
  const isLoading = useBudgetStore((s) => s.isLoading);
  const isLoadingGoals = useBudgetStore((s) => s.isLoadingGoals);
  const setTransactions = useBudgetStore((s) => s.setTransactions);
  const setGoalRows = useBudgetStore((s) => s.setGoalRows);
  const ui = useBudgetUi();
  const { dispatch } = ui;
  const { user } = useAuthStore();
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const { bills } = useUtilitiesStore();
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const { pending: cloning, run: runClone } = useAsyncAction();
  const { pending: txSaving, run: runTxSave } = useAsyncAction();
  const { pending: ledgerSaving, run: runLedgerSave } = useAsyncAction();
  const { wrap: wrapTxPending, isPending: isTxPending } = usePendingIds();

  const utilitySplitConfigured = user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? false;
  const utilitySplitEnabled = utilitySplitConfigured && canUseFeature(user, 'utility_split');
  const canUseAi = canUseFeature(user, 'ai');
  const isReader = isHouseholdReader(user);
  const partnerId = user?.household?.utilitySplitPartnerId ?? user?.household?.utility_split_partner_id;
  const onHouseholdSide = UtilitiesService.isHouseholdSide(user?.id, partnerId);
  const getBillPortion = useCallback(
    (b: Parameters<typeof UtilitiesService.ourUtilityPortion>[0]) =>
      UtilitiesService.ourUtilityPortion(b, onHouseholdSide, utilitySplitEnabled),
    [onHouseholdSide, utilitySplitEnabled],
  );

  const walletManualBalance =
    activeWalletId !== null ? (resolveActiveWallet(user, activeWalletId)?.manualBalance ?? 0) : 0;

  useEffect(() => {
    if (activeWalletId === null) return;
    dispatch({
      type: 'SET_MANUAL_BALANCE_STATE',
      field: 'manualBalance',
      value: String(walletManualBalance),
    });
  }, [activeWalletId, dispatch, walletManualBalance]);

  useEffect(() => {
    if (activeWalletId === null) return;

    let cancelled = false;
    const loadBudget = async () => {
      try {
        await ensureBudgetPeriodLoaded(activeWalletId, selectedMonth, selectedYear, { silent: true });
      } catch (error) {
        if (!isAbortError(error) && !cancelled) {
          console.error('Failed to fetch budget data', error);
        }
      }
    };

    void loadBudget();
    return () => {
      cancelled = true;
    };
  }, [activeWalletId, selectedMonth, selectedYear]);

  useEffect(() => {
    if (!canUseAi || activeWalletId === null) return;
    if (loadedWalletId !== activeWalletId) return;

    let cancelled = false;
    const loadAiInsights = async () => {
      try {
        await ensureBudgetAiInsightsLoaded(activeWalletId, selectedYear, selectedMonth, { silent: true });
      } catch (error) {
        if (!isAbortError(error) && !cancelled) {
          console.error('Failed to fetch budget AI insights', error);
        }
      }
    };

    void loadAiInsights();
    return () => {
      cancelled = true;
    };
  }, [activeWalletId, canUseAi, loadedWalletId, selectedMonth, selectedYear]);

  const selectedYearMonth = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
  const goalsReady =
    loadedMonth === selectedMonth && loadedYear === selectedYear && !isLoadingGoals;

  const budgetCashflow = useBudgetCashflowMetrics({
    manualBalance: Number(ui.manualBalance) || walletManualBalance,
    transactions,
    goalBudgetRows,
    goalsReady,
    bills,
    selectedMonth,
    selectedYear,
    onHouseholdSide,
    utilitySplitEnabled,
  });

  const {
    activeGoalRows,
    allMonthTransactions,
    reserves,
    incomes,
    expenses,
    monthlyBills,
    totalIncomeReceived,
    totalActualSpent,
    totalProjectedExpense,
    categoryData,
  } = useMemo(() => {
    const monthTransactions = transactions.filter((t) => t.dueDate.startsWith(selectedYearMonth));
    const goalRows = goalsReady ? goalBudgetRows : [];
    const monthReserves = monthTransactions.filter((t) => t.isReserve);
    const monthIncomes = monthTransactions.filter((t) => t.type === 'income' && !t.isReserve);
    const monthExpenses = [
      ...monthTransactions.filter((t) => t.type === 'expense' && !t.isReserve),
      ...goalRows,
    ];
    const monthBills = bills.filter(
      (b) => b.dueDate.startsWith(selectedYearMonth) && !UtilitiesService.isLegacySettlementBill(b),
    );

    const incomeReceived = BudgetService.calculateTotalIncomeReceived(monthIncomes);
    const actualSpent = BudgetService.calculateTotalActualSpent(monthExpenses, monthBills, getBillPortion);
    const projectedExpense = BudgetService.calculateTotalProjectedExpense(monthExpenses, monthBills, getBillPortion);
    const groupedCategories = BudgetService.groupTransactionsByCategory(
      categories,
      monthExpenses,
      monthBills,
      getBillPortion,
    );

    return {
      activeGoalRows: goalRows,
      allMonthTransactions: monthTransactions,
      reserves: monthReserves,
      incomes: monthIncomes,
      expenses: monthExpenses,
      monthlyBills: monthBills,
      totalIncomeReceived: incomeReceived,
      totalActualSpent: actualSpent,
      totalProjectedExpense: projectedExpense,
      categoryData: groupedCategories,
    };
  }, [
    bills,
    categories,
    getBillPortion,
    goalBudgetRows,
    goalsReady,
    selectedYearMonth,
    transactions,
  ]);

  const cashflowMetrics: MetricItem[] = [
    {
      label: 'Fizetendő',
      value: formatHUF(budgetCashflow.totalPending),
      info: HELP.budget.payable,
      hint: 'Ebben a hónapban',
      icon: ReceiptText,
      tone: budgetCashflow.totalPending > 0 ? 'warning' : 'success',
    },
    {
      label: 'Marad',
      value: formatHUF(budgetCashflow.disposableRemaining),
      info: HELP.budget.remaining,
      hint: 'Egyenleg − fizetendő',
      icon: TrendingUp,
      tone: budgetCashflow.disposableRemaining >= 0 ? 'success' : 'danger',
      emphasis: true,
    },
    {
      label: 'Lejárt',
      value: formatHUF(budgetCashflow.overdueTotal),
      info: HELP.budget.overdue,
      hint: budgetCashflow.overdueTotal > 0 ? 'Sürgős!' : 'Nincs lejárt',
      icon: AlertCircle,
      tone: budgetCashflow.overdueTotal > 0 ? 'danger' : 'default',
    },
  ];

  const summaryMetrics: MetricItem[] = [
    { label: 'Tervezett keret', value: formatHUF(totalProjectedExpense), tone: 'default' },
    { label: 'Már kifizetve', value: formatHUF(totalActualSpent), tone: 'warning' },
    { label: 'Befolyt bevétel', value: formatHUF(totalIncomeReceived), tone: 'success' },
    { label: 'Havi egyenleg', value: formatHUF(totalIncomeReceived - totalActualSpent), tone: totalIncomeReceived - totalActualSpent < 0 ? 'danger' : 'primary' },
  ];

  const activeLedgerItems =
    transactions.find((t) => t.id === ui.activeTxId)?.subItems ??
    activeGoalRows.find((t) => t.id === ui.activeTxId)?.subItems;

  // Handlers
  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditHousehold(user)) return;

    await runTxSave(async () => {
      const cleanAmount = ui.txAmount.toString().replace(',', '.');
      const walletId = getActiveWalletId() ?? undefined;
      const data = {
        type: ui.txType,
        description: ui.txDesc,
        category: ui.txCat,
        amount: Number(cleanAmount),
        dueDate: ui.txDue,
        isBudget: ui.txIsBudget,
        isReserve: ui.txIsReserve,
        paidDate: ui.txPaidDate,
        walletId,
      };

      try {
        if (ui.editTxId !== null && typeof ui.editTxId === 'number') {
          const res = await BudgetService.updateTransaction(ui.editTxId, data);
          setTransactions(transactions.map((t) => (t.id === ui.editTxId ? res.data : t)), loadedWalletId!);
        } else {
          const res = await BudgetService.createTransaction(data);
          setTransactions([...transactions, res.data], loadedWalletId!);
        }
        ui.dispatch({ type: 'SET_TX_MODAL_OPEN', payload: false });
      } catch (error) {
        console.error('Failed to submit transaction', error);
      }
    });
  };

  const handleLedgerSubmit = async () => {
    if (!canEditHousehold(user)) return;
    if (ui.activeTxId === null) return;
    const activeTxId = ui.activeTxId;

    await runLedgerSave(async () => {
      const cleanAmount = ui.ledgerAmount.replace(',', '.');
      const isGoal = ui.ledgerIsGoalPayment || isSavingsGoalTransaction({ id: activeTxId });
      const monthDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const amt = isGoal ? Math.abs(Number(cleanAmount)) : -Math.abs(Number(cleanAmount));

      try {
        const res = await BudgetService.addItem(activeTxId, {
          date: isGoal ? monthDate : todayDate(),
          amount: amt,
          reason: ui.ledgerReason || (isGoal ? 'Költségvetés – havi befizetés' : ''),
        });

        if (isGoal) {
          setGoalRows(
            goalBudgetRows.map((row) => (row.id === ui.activeTxId ? res.data : row)),
            selectedMonth,
            selectedYear,
            loadedWalletId!,
          );
          void syncSavingsForWallet(loadedWalletId);
        } else {
          setTransactions(transactions.map((t) => (t.id === ui.activeTxId ? res.data : t)), loadedWalletId!);
        }

        if (isGoal) {
          ui.dispatch({ type: 'CLOSE_LEDGER_MODAL' });
        } else {
          ui.dispatch({ type: 'SET_LEDGER_FIELD', field: 'ledgerAmount', value: '' });
          ui.dispatch({ type: 'SET_LEDGER_FIELD', field: 'ledgerReason', value: '' });
        }
      } catch (error) {
        console.error('Failed to submit ledger item', error);
      }
    });
  };

  const deleteTransaction = async (id: number) => {
    try {
      const tx = transactions.find((t) => t.id === id);
      await BudgetService.deleteTransaction(id);
      setTransactions(transactions.filter((t) => t.id !== id), loadedWalletId!);
      
      if (tx?.category === 'Rezsi elszámolás') {
        void Promise.all([
          import('@/services/UtilitiesService').then(({ utilitiesService }) =>
            utilitiesService.fetchAll({ silent: true }).then((index) => {
              useUtilitiesStore.getState().setUtilities(index);
            }),
          ),
          useAuthStore.getState().fetchMe(),
        ]);
      }
    } catch (error) {
      console.error('Failed to delete transaction', error);
    }
  };

  const clonePreviousMonthHandler = async (m: number, y: number, walletId: number) => {
    await runClone(async () => {
      await BudgetService.cloneMonth(m, y, walletId);
      await ensureBudgetPeriodLoaded(walletId, m, y, { silent: true });
    });
  };

  const handleAutoCategory = async () => {
    if (!canEditHousehold(user)) return;
    if (!ui.txDesc.trim()) return;

    ui.dispatch({ type: 'SET_TX_FIELD', field: 'isCategoryLoading', value: true });
    try {
      const category = await AiFinanceService.autoCategorizeTransaction({
        description: ui.txDesc,
        type: ui.txType,
        amount: ui.txAmount ? Number(ui.txAmount) : undefined,
        candidate_categories: categories,
      });
      if (category) {
        ui.dispatch({ type: 'SET_TX_FIELD', field: 'txCat', value: category });
      }
    } finally {
      ui.dispatch({ type: 'SET_TX_FIELD', field: 'isCategoryLoading', value: false });
    }
  };

  const updateTransaction = async (id: number, data: Partial<Omit<CashTransaction, 'id'>>) => {
    try {
      const res = await BudgetService.updateTransaction(id, data);
      setTransactions(
        transactions.map((t) => (t.id === id ? res.data : t)),
        loadedWalletId!,
      );
    } catch (error) {
      console.error('Failed to update transaction', error);
    }
  };

  const handleManualBalanceSave = async () => {
    if (!canEditHousehold(user)) return;
    if (activeWalletId === null) return;

    ui.dispatch({ type: 'SET_MANUAL_BALANCE_STATE', field: 'balanceSaving', value: true });
    try {
      await useAuthStore.getState().updateWalletManualBalance(activeWalletId, Number(ui.manualBalance) || 0);
      ui.dispatch({ type: 'SET_MANUAL_BALANCE_STATE', field: 'balanceSaved', value: true });
      window.setTimeout(() => ui.dispatch({ type: 'SET_MANUAL_BALANCE_STATE', field: 'balanceSaved', value: false }), 2000);
    } finally {
      ui.dispatch({ type: 'SET_MANUAL_BALANCE_STATE', field: 'balanceSaving', value: false });
    }
  };

  return {
    transactions,
    goalBudgetRows,
    categories,
    aiOverspend,
    aiCashflowForecast,
    loadedWalletId,
    loadedMonth,
    loadedYear,
    isLoading,
    isLoadingGoals,
    ...ui,
    deleteTransaction,
    updateTransaction,
    clonePreviousMonth: clonePreviousMonthHandler,
    selectedMonth,
    selectedYear,
    cloning,
    txSaving,
    ledgerSaving,
    runClone,
    openTxForm: (tx?: CashTransaction | null, defaultType?: 'income' | 'expense') => {
      if (isReader) return;
      ui.dispatch({ type: 'OPEN_TX_FORM', payload: { tx, defaultType, categories } });
    },
    handleManualBalanceSave,
    isReader,
    walletDataReady: isWalletTransactionsReady(activeWalletId, loadedWalletId, isLoading),
    goalsDataReady: goalsReady,
    goalsLoading: isLoadingGoals,
    gridLoading: !isWalletTransactionsReady(activeWalletId, loadedWalletId, isLoading),
    cashflowMetrics,
    summaryMetrics,
    categoryData,
    totalProjectedExpense,
    incomes,
    expenses,
    reserves,
    monthlyBills,
    getBillPortion,
    today: todayDate(),
    requestDelete,
    wrapTxPending,
    isTxPending,
    openGoalPaymentModal: (goalRow: CashTransaction) => {
      if (isReader) return;
      ui.dispatch({ type: 'OPEN_GOAL_PAYMENT_MODAL', payload: { goalRow } });
    },
    openLedgerModal: (txId: number | string) => {
      if (isReader) return;
      ui.dispatch({ type: 'OPEN_LEDGER_MODAL', payload: { txId } });
    },
    handleTxSubmit,
    handleAutoCategory,
    closeLedgerModal: () => ui.dispatch({ type: 'CLOSE_LEDGER_MODAL' }),
    handleLedgerSubmit,
    activeLedgerItems,
    ConfirmDeleteModal,
    setManualBalance: (val: string) => ui.dispatch({ type: 'SET_MANUAL_BALANCE_STATE', field: 'manualBalance', value: val }),
    setBalanceSaved: (val: boolean) => ui.dispatch({ type: 'SET_MANUAL_BALANCE_STATE', field: 'balanceSaved', value: val }),
    setLedgerAmount: (val: any) => {
      if (typeof val === 'object' && val?.type) {
        ui.dispatch(val);
      } else {
        ui.dispatch({ type: 'SET_LEDGER_FIELD', field: 'ledgerAmount', value: val });
      }
    },
    setLedgerReason: (val: any) => {
      if (typeof val === 'object' && val?.type) {
        ui.dispatch(val);
      } else {
        ui.dispatch({ type: 'SET_LEDGER_FIELD', field: 'ledgerReason', value: val });
      }
    },
  };
}

export type BudgetLogicResult = ReturnType<typeof useBudgetLogicState>;
