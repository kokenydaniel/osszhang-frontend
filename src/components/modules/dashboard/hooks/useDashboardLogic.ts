'use client';

import { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { useSavingsStore } from '@/stores/useSavingsStore';
import { useMetersStore } from '@/stores/useMetersStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useDebtsStore } from '@/stores/useDebtsStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { BudgetService } from '@/services/BudgetService';
import { UtilitiesService } from '@/services/UtilitiesService';
import { canUseModuleWithTier, type ModuleId } from '@/lib/moduleAccess';
import { canUseFeature } from '@/lib/checkAccess';
import { isHouseholdReader } from '@/lib/householdRole';
import { activeWalletManualBalance } from '@/lib/walletBalance';
import { today as todayDate } from '@/lib/dates';
import { useBudgetCashflowMetrics } from '@/hooks/useBudgetCashflowMetrics';
import {
  computeDashboardSnapshot,
  dashboardGreeting,
  dashboardTodayFormatted,
} from '@/components/modules/dashboard/lib/dashboardCalculations';
import { useDashboardPayActions } from '@/components/modules/dashboard/hooks/useDashboardPayActions';
import { isDashboardFinancialDataReady } from '@/components/modules/dashboard/lib/dashboardFinancialDataReady';
import { useWalletStore } from '@/stores/useWalletStore';
import type { AiCfoContextPayload } from '@/types';

export function useDashboardLogic() {
  const { user, aiDashboardAdvice } = useAuthStore();
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const { transactions, goalBudgetRows, loadedMonth, loadedYear, isLoading: budgetIsLoading, isLoadingGoals: budgetIsLoadingGoals, loadedWalletId: budgetLoadedWalletId } = useBudgetStore();
  const { bills, settlements, isLoaded: utilitiesIsLoaded, isLoading: utilitiesIsLoading } = useUtilitiesStore();
  const { savings, investments, loadedWalletId: savingsLoadedWalletId, isLoading: savingsIsLoading } = useSavingsStore();
  const { meters } = useMetersStore();
  const { orders } = useBusinessStore();
  const { debts, loadedWalletId: debtsLoadedWalletId, isLoading: debtsIsLoading } = useDebtsStore();
  const { selectedMonth, selectedYear, exchangeRates } = usePreferenceStore();
  const { handlePayItem, isReader } = useDashboardPayActions();

  const isAdmin = user?.role === 'admin';
  const canUse = useCallback(
    (mod: string) => canUseModuleWithTier(user, mod as ModuleId),
    [user],
  );
  const businessEnabled = canUse('business');
  const utilitySplitConfigured =
    user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? false;
  const utilitySplitEnabled =
    canUse('utilities') && utilitySplitConfigured && canUseFeature(user, 'utility_split');
  const utilityLabels = useMemo(() => UtilitiesService.resolveSplitLabels(user), [user]);
  const { onHouseholdSide, partnerId, counterpartyLabel } = utilityLabels;
  const businessName = user?.household?.businessName ?? user?.household?.business_name ?? 'Vállalkozás';
  const householdName = user?.household?.name || 'Otthon';
  const householdMembers = user?.household?.users || [];
  const { greeting, GreetingIcon } = useMemo(() => dashboardGreeting(), []);
  const todayFormatted = dashboardTodayFormatted();
  const todayStr = todayDate();
  const manualBalance = activeWalletManualBalance(user);

  const goalsReadyForMetrics = loadedMonth === selectedMonth && loadedYear === selectedYear;

  const budgetCashflow = useBudgetCashflowMetrics({
    manualBalance,
    transactions,
    goalBudgetRows,
    goalsReady: goalsReadyForMetrics,
    bills,
    selectedMonth,
    selectedYear,
    onHouseholdSide,
    utilitySplitEnabled,
    includeBudgetExpenses: canUse('budget'),
    includeUtilityBills: canUse('utilities'),
    includeGoalRows: canUse('budget') && goalsReadyForMetrics,
  });

  const lockedSavings = useMemo(
    () => BudgetService.calculateLockedSavings(savings, investments, exchangeRates),
    [exchangeRates, investments, savings],
  );

  const cashflowMetrics = useMemo(
    () => ({ ...budgetCashflow, lockedSavings }),
    [budgetCashflow, lockedSavings],
  );

  const financialDataReady = useMemo(
    () =>
      isDashboardFinancialDataReady({
        activeWalletId,
        canUse,
        selectedMonth,
        selectedYear,
        budgetLoadedWalletId,
        budgetIsLoading,
        budgetIsLoadingGoals,
        budgetLoadedMonth: loadedMonth,
        budgetLoadedYear: loadedYear,
        utilitiesIsLoaded,
        utilitiesIsLoading,
        savingsLoadedWalletId,
        savingsIsLoading,
        debtsLoadedWalletId,
        debtsIsLoading,
      }),
    [
      activeWalletId,
      budgetIsLoading,
      budgetIsLoadingGoals,
      budgetLoadedWalletId,
      canUse,
      debtsIsLoading,
      debtsLoadedWalletId,
      loadedMonth,
      loadedYear,
      savingsIsLoading,
      savingsLoadedWalletId,
      selectedMonth,
      selectedYear,
      utilitiesIsLoaded,
      utilitiesIsLoading,
    ],
  );

  const snapshot = useMemo(() => {
    const base = computeDashboardSnapshot({
      user,
      canUse,
      businessEnabled,
      utilitySplitEnabled,
      counterpartyLabel,
      businessName,
      cashflow: cashflowMetrics,
      transactions,
      bills,
      settlements,
      savings,
      investments,
      meters,
      orders,
      debts,
      selectedMonth,
      selectedYear,
      exchangeRates,
      onHouseholdSide,
      partnerId,
      todayStr,
    });

    const aiCfoContext: AiCfoContextPayload | null =
      activeWalletId !== null && financialDataReady
        ? { ...base.aiCfoContext, wallet_id: activeWalletId }
        : null;

    return { ...base, aiCfoContext };
  }, [
    user,
    canUse,
    businessEnabled,
    utilitySplitEnabled,
    counterpartyLabel,
    businessName,
    cashflowMetrics,
    transactions,
    bills,
    settlements,
    savings,
    investments,
    meters,
    orders,
    debts,
    selectedMonth,
    selectedYear,
    exchangeRates,
    onHouseholdSide,
    partnerId,
    todayStr,
    activeWalletId,
    financialDataReady,
  ]);

  return {
    user,
    isAdmin,
    isReader,
    canUse,
    businessEnabled,
    utilitySplitEnabled,
    counterpartyLabel,
    householdName,
    householdMembers,
    greeting,
    GreetingIcon,
    todayFormatted,
    aiDashboardAdvice,
    investments,
    todayStr,
    handlePayItem,
    financialDataReady,
    ...snapshot,
  };
}

export type DashboardLogicResult = ReturnType<typeof useDashboardLogic>;
