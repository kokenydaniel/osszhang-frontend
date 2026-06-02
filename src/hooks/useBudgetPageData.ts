'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useBudgetStore } from '@/stores/budgetStore';
import { useUtilitiesStore } from '@/stores/utilitiesStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { useDebtsStore } from '@/stores/debtsStore';
import { usePeriodStore } from '@/stores/usePeriodStore';
import { resolveDebtsSettings } from '@/settings/debts';
import { resolveBudgetSettings, resolveCategoryColor } from '@/settings/budget';
import { useDebtBudgetInstallments } from '@/hooks/useDebtBudgetInstallments';
import { canUseModuleWithTier } from '@/helpers/module-access';
import { formatHUF } from '@/utils';
import { utilitiesCalculations } from '@/calculations/utilities';
import { HELP } from '@/config/help';
import { resolveActiveWallet } from '@/utils/wallet-balance';
import { canUseFeature } from '@/helpers/check-access';
import { isHouseholdReader } from '@/utils/household-role';
import { isStoreLoading } from '@/utils/loadable-status';
import { AlertCircle, ReceiptText, TrendingUp } from 'lucide-react';
import type { MetricItem } from '@/components/design';
import { budgetCalculations } from '@/calculations/budget';
import type { CashTransaction, UtilityBill } from '@/types';
import { useBudgetCashflowMetrics } from '@/hooks/useBudgetCashflowMetrics';
import { useMissedIncomeSummary } from '@/hooks/useMissedIncomeSummary';

export function useBudgetPageData(manualBalance: number) {
  const { user } = useAuthStore();
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const { selectedMonth, selectedYear } = usePeriodStore();

  const canUseAi = canUseFeature(user, 'ai');
  const transactions = useBudgetStore((s) => s.transactions);
  const goalBudgetRows = useBudgetStore((s) => s.goalRows);
  const aiOverspend = useBudgetStore((s) => s.aiOverspend);
  const budgetStatus = useBudgetStore((s) => s.status);
  const setTransactions = useBudgetStore((s) => s.setTransactions);
  const setGoalRows = useBudgetStore((s) => s.setGoalRows);
  const bills = useUtilitiesStore((s) => s.bills);
  const utilitiesStatus = useUtilitiesStore((s) => s.status);

  useEffect(() => {
    if (activeWalletId === null) return;
    void useBudgetStore.getState().fetch(activeWalletId, selectedYear, selectedMonth);
  }, [activeWalletId, selectedYear, selectedMonth]);

  useEffect(() => {
    void useUtilitiesStore.getState().fetch();
  }, []);

  const debts = useDebtsStore((s) => s.debts);
  const debtsSettings = useMemo(() => resolveDebtsSettings(user?.household), [user?.household]);
  const budgetSettings = useMemo(() => resolveBudgetSettings(user?.household), [user?.household]);
  const categoryColor = useCallback(
    (name: string) => resolveCategoryColor(name, budgetSettings),
    [budgetSettings],
  );

  useEffect(() => {
    if (activeWalletId === null) return;
    if (!canUseModuleWithTier(user, 'debts')) return;
    void useDebtsStore.getState().fetch(activeWalletId);
  }, [activeWalletId, user]);

  useEffect(() => {
    void useBudgetStore
      .getState()
      .fetchAiInsights(activeWalletId, selectedYear, selectedMonth, canUseAi);
  }, [activeWalletId, selectedYear, selectedMonth, canUseAi]);

  const { summary: missedIncomeSummary, refresh: refreshMissedIncome } = useMissedIncomeSummary({
    walletId: activeWalletId,
    selectedYear,
    throughMonth: selectedMonth,
    enabled: activeWalletId !== null,
  });

  const refresh = useCallback(() => {
    if (activeWalletId === null) return;
    void useBudgetStore.getState().fetch(activeWalletId, selectedYear, selectedMonth, true);
    void useUtilitiesStore.getState().fetch(true);
    void refreshMissedIncome();
  }, [activeWalletId, selectedYear, selectedMonth, refreshMissedIncome]);

  const isLoading = isStoreLoading(budgetStatus) || isStoreLoading(utilitiesStatus);
  const categories = user?.household?.categories?.length
    ? user.household.categories
    : ['Fizetés', 'Élelmiszer', 'Rezsi'];

  const utilitySplitConfigured =
    user?.household?.utility_split_enabled ?? user?.household?.utility_split_enabled ?? false;
  const utilitySplitEnabled = utilitySplitConfigured && canUseFeature(user, 'utility_split');
  const isReader = isHouseholdReader(user);
  const partnerId =
    user?.household?.utility_split_partner_id ?? user?.household?.utility_split_partner_id;
  const onHouseholdSide = utilitiesCalculations.isHouseholdSide(user?.id, partnerId);

  const getBillPortion = useCallback(
    (b: UtilityBill) =>
      utilitiesCalculations.budgetBillPortion(b, onHouseholdSide, utilitySplitEnabled),
    [onHouseholdSide, utilitySplitEnabled],
  );

  const selectedYearMonth = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
  const goalsReady = !isLoading;

  const debtInstallments = useDebtBudgetInstallments({
    debts,
    user,
    selectedYear,
    selectedMonth,
    categories,
    paymentCategoryPattern: debtsSettings.payment_category_pattern,
    enabled: goalsReady,
  });

  const budgetCashflow = useBudgetCashflowMetrics({
    manualBalance,
    transactions,
    goalBudgetRows,
    goalsReady,
    bills,
    selectedMonth,
    selectedYear,
    onHouseholdSide,
    utilitySplitEnabled,
    extraMonthExpenses: debtInstallments,
  });

  const {
    activeGoalRows,
    incomes,
    expenses,
    reserves,
    monthlyBills,
    totalIncomeReceived,
    totalActualSpent,
    totalProjectedExpense,
    categoryData,
  } = useMemo(() => {
    const monthTransactions = transactions.filter((t: CashTransaction) =>
      t.dueDate.startsWith(selectedYearMonth),
    );
    const goalRows = goalsReady ? goalBudgetRows : [];
    const monthReserves = monthTransactions.filter((t: CashTransaction) => t.isReserve);
    const monthIncomes = monthTransactions.filter(
      (t: CashTransaction) => t.type === 'income' && !t.isReserve,
    );
    const monthExpenses = [
      ...monthTransactions.filter((t: CashTransaction) => t.type === 'expense' && !t.isReserve),
      ...goalRows,
      ...debtInstallments,
    ];
    const monthBills = bills.filter(
      (b) => b.dueDate.startsWith(selectedYearMonth) && !utilitiesCalculations.isLegacySettlementBill(b),
    );

    return {
      activeGoalRows: goalRows,
      incomes: monthIncomes,
      expenses: monthExpenses,
      reserves: monthReserves,
      monthlyBills: monthBills,
      totalIncomeReceived: budgetCalculations.calculateTotalIncomeReceived(monthIncomes),
      totalActualSpent: budgetCalculations.calculateTotalActualSpent(
        monthExpenses,
        monthBills,
        getBillPortion,
      ),
      totalProjectedExpense: budgetCalculations.calculateTotalProjectedExpense(
        monthExpenses,
        monthBills,
        getBillPortion,
      ),
      categoryData: budgetCalculations.groupTransactionsByCategory(
        categories,
        monthExpenses,
        monthBills,
        getBillPortion,
      ),
    };
  }, [bills, categories, debtInstallments, getBillPortion, goalBudgetRows, goalsReady, selectedYearMonth, transactions]);

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
    {
      label: 'Havi egyenleg',
      value: formatHUF(totalIncomeReceived - totalActualSpent),
      tone: totalIncomeReceived - totalActualSpent < 0 ? 'danger' : 'primary',
    },
  ];

  const walletManualBalance =
    activeWalletId !== null
      ? (resolveActiveWallet(user, activeWalletId)?.manual_balance ?? 0)
      : 0;

  const getLedgerItems = useCallback(
    (txId: number | string) =>
      transactions.find((t) => t.id === txId)?.subItems ??
      activeGoalRows.find((t) => t.id === txId)?.subItems,
    [activeGoalRows, transactions],
  );

  return {
    user,
    activeWalletId,
    selectedMonth,
    selectedYear,
    categories,
    transactions,
    goalBudgetRows,
    aiOverspend,
    isLoading,
    isReader,
    refresh,
    setTransactions,
    setGoalRows,
    cashflowMetrics,
    summaryMetrics,
    categoryData,
    totalProjectedExpense,
    incomes,
    expenses,
    reserves,
    monthlyBills,
    getBillPortion,
    getLedgerItems,
    walletManualBalance,
    debts,
    debtsSettings,
    missedIncomeSummary,
    refreshMissedIncome,
    categoryColor,
    budgetSettings,
  };
}
