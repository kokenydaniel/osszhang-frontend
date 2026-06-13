'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useBudgetStore } from '@/stores/budgetStore';
import { useUtilitiesStore } from '@/stores/utilitiesStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { useDebtsStore } from '@/stores/debtsStore';
import { useInsuranceStore } from '@/stores/insuranceStore';
import { useRentalStore } from '@/stores/rentalStore';
import { usePeriodStore } from '@/stores/usePeriodStore';
import { resolveDebtsSettings } from '@/settings/debts';
import { resolveInsuranceSettings } from '@/settings/insurance';
import { resolveBudgetSettings, resolveCategoryColor } from '@/settings/budget';
import { useDebtBudgetInstallments } from '@/hooks/useDebtBudgetInstallments';
import { useInsuranceBudgetPremiums } from '@/hooks/useInsuranceBudgetPremiums';
import { useRentalBudgetIncomes } from '@/hooks/useRentalBudgetIncomes';
import { resolveRentalSettings } from '@/settings/rental';
import { canUseModuleWithTier } from '@/helpers/module-access';
import { formatHUF } from '@/utils';
import { utilitiesCalculations } from '@/calculations/utilities';
import { HELP } from '@/config/help';
import { activeWalletManualBalance } from '@/utils/wallet-balance';
import { canUseFeature } from '@/helpers/check-access';
import { isHouseholdReader } from '@/utils/household-role';
import { isStoreLoading } from '@/utils/loadable-status';
import { AlertCircle, ReceiptText, TrendingUp } from 'lucide-react';
import type { MetricItem } from '@/components/design';
import { budgetCalculations } from '@/calculations/budget';
import type { CashTransaction, UtilityBill } from '@/types';
import { useBudgetCashflowMetrics } from '@/hooks/useBudgetCashflowMetrics';
import { useMissedIncomeSummary } from '@/hooks/useMissedIncomeSummary';
import { useEnsureExchangeRates } from '@/hooks/useEnsureExchangeRates';
import { useExchangeRatesStore } from '@/stores/useExchangeRatesStore';

export function useBudgetPageData(manualBalance: number) {
  const { user } = useAuthStore();
  useEnsureExchangeRates();
  const exchangeRates = useExchangeRatesStore((s) => s.rates);
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const { selectedMonth, selectedYear } = usePeriodStore();

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
  const insurancePolicies = useInsuranceStore((s) => s.budgetPolicies);
  const rentalProperties = useRentalStore((s) => s.properties);
  const rentalIncomeEntries = useRentalStore((s) => s.incomeEntries);
  const debtsSettings = useMemo(() => resolveDebtsSettings(user?.household), [user?.household]);
  const insuranceSettings = useMemo(() => resolveInsuranceSettings(user?.household), [user?.household]);
  const rentalSettings = useMemo(() => resolveRentalSettings(user?.household), [user?.household]);
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
    if (!canUseModuleWithTier(user, 'insurance')) return;
    void useInsuranceStore.getState().fetch();
  }, [user]);

  useEffect(() => {
    if (!canUseModuleWithTier(user, 'rental')) return;
    void useRentalStore.getState().fetch(selectedYear, selectedMonth);
  }, [user, selectedYear, selectedMonth]);

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

  const insurancePremiums = useInsuranceBudgetPremiums({
    policies: insurancePolicies,
    user,
    selectedYear,
    selectedMonth,
    categories,
    paymentCategoryPattern: insuranceSettings.payment_category_pattern,
    enabled: goalsReady,
  });

  const rentalBudgetIncomes = useRentalBudgetIncomes({
    properties: rentalProperties,
    incomeEntries: rentalIncomeEntries,
    user,
    selectedYear,
    selectedMonth,
    categories,
    incomeCategoryPattern: rentalSettings.income_category_pattern,
    enabled: goalsReady,
  });

  const syncedInsuranceExpenses = useMemo(
    () => [...debtInstallments, ...insurancePremiums],
    [debtInstallments, insurancePremiums],
  );

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
    extraMonthExpenses: syncedInsuranceExpenses,
    extraMonthIncomes: rentalBudgetIncomes,
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
    const monthIncomes = [
      ...monthTransactions.filter((t: CashTransaction) => t.type === 'income' && !t.isReserve),
      ...rentalBudgetIncomes,
    ];
    const monthExpenses = [
      ...monthTransactions.filter((t: CashTransaction) => t.type === 'expense' && !t.isReserve),
      ...goalRows,
      ...syncedInsuranceExpenses,
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
      totalIncomeReceived: budgetCalculations.calculateTotalIncomeReceived(monthIncomes, exchangeRates),
      totalActualSpent: budgetCalculations.calculateTotalActualSpent(
        monthExpenses,
        monthBills,
        getBillPortion,
        exchangeRates,
      ),
      totalProjectedExpense: budgetCalculations.calculateTotalProjectedExpense(
        monthExpenses,
        monthBills,
        getBillPortion,
        exchangeRates,
      ),
      categoryData: budgetCalculations.groupTransactionsByCategory(
        categories,
        monthExpenses,
        monthBills,
        getBillPortion,
        exchangeRates,
      ),
    };
  }, [
    bills,
    categories,
    syncedInsuranceExpenses,
    rentalBudgetIncomes,
    exchangeRates,
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
    {
      label: 'Havi egyenleg',
      value: formatHUF(totalIncomeReceived - totalActualSpent),
      tone: totalIncomeReceived - totalActualSpent < 0 ? 'danger' : 'primary',
    },
  ];

  const walletManualBalance = activeWalletManualBalance(user);

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
    insurancePolicies,
    insuranceSettings,
    rentalProperties,
    rentalIncomeEntries,
    rentalSettings,
    missedIncomeSummary,
    refreshMissedIncome,
    categoryColor,
    budgetSettings,
  };
}
