'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { useUtilitiesStore } from '@/stores/utilitiesStore';
import { useSavingsStore } from '@/stores/savingsStore';
import { useMetersStore } from '@/stores/metersStore';
import { useBusinessStore } from '@/stores/businessStore';
import { useDebtsStore } from '@/stores/debtsStore';
import { useInsuranceStore } from '@/stores/insuranceStore';
import { useRentalStore } from '@/stores/rentalStore';
import { usePocketMoneyStore } from '@/stores/pocketMoneyStore';
import { useReceivablesStore } from '@/stores/receivablesStore';
import { usePeriodStore } from '@/stores/usePeriodStore';
import { useExchangeRatesStore } from '@/stores/useExchangeRatesStore';
import { useEnsureExchangeRates } from '@/hooks/useEnsureExchangeRates';
import { budgetCalculations } from '@/calculations/budget';
import { utilitiesCalculations } from '@/calculations/utilities';
import { canUseModuleWithTier, type ModuleId } from '@/helpers/module-access';
import { canUseFeature } from '@/helpers/check-access';
import { activeWalletManualBalance } from '@/utils/wallet-balance';
import { today as todayDate, toDayjs } from '@/utils/dates';
import { useBudgetCashflowMetrics } from '@/hooks/useBudgetCashflowMetrics';
import { useDebtBudgetInstallments } from '@/hooks/useDebtBudgetInstallments';
import { useInsuranceBudgetPremiums } from '@/hooks/useInsuranceBudgetPremiums';
import { useMissedIncomeSummary } from '@/hooks/useMissedIncomeSummary';
import { resolveBudgetSettings } from '@/settings/budget';
import { resolveDashboardSettings } from '@/settings/dashboard';
import {
  canLoadDashboardAiCfo,
  canLoadUtilityAnomalies,
  filterDashboardWidgetOrder,
  needsExchangeRatesOnDashboard,
} from '@/helpers/dashboard-access';
import {
  DASHBOARD_FETCH_PRIORITY,
  DASHBOARD_MODULE_IDS,
  ensureModulesLoaded,
} from '@/helpers/module-data-plan';
import { resolveDebtsSettings } from '@/settings/debts';
import { resolveBusinessSettings } from '@/settings/business';
import { resolveInsuranceSettings } from '@/settings/insurance';
import { resolveRentalSettings } from '@/settings/rental';
import { resolveMetersSettings } from '@/settings/meters';
import { resolvePocketMoneySettings } from '@/settings/pocket-money';
import { computeDashboardBusinessTaxAlert } from '@/helpers/dashboard-business-tax-alert';
import { computeDashboardPocketMoneyInterestAlert } from '@/helpers/dashboard-pocket-money-alert';
import { ensureUtilityAnomaliesLoaded } from '@/helpers/utility-anomalies-loader';
import { formatMonthYear } from '@/utils';
import {
  computeDashboardSnapshot,
  dashboardGreeting,
  dashboardTodayFormatted,
} from '@/helpers/dashboard-calculations';
import { useDashboardPayActions } from '@/hooks/useDashboardPayActions';
import { isDashboardFinancialDataReady } from '@/helpers/dashboard-financial-data-ready';
import { useWalletStore } from '@/stores/useWalletStore';
import type { AiCfoContextPayload } from '@/types';

export function useDashboardPageData() {
  const { user, aiDashboardAdvice } = useAuthStore();
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const { selectedMonth, selectedYear } = usePeriodStore();
  const exchangeRates = useExchangeRatesStore((s) => s.rates);
  const householdId = user?.household?.id;

  const transactions = useBudgetStore((s) => s.transactions);
  const goalBudgetRows = useBudgetStore((s) => s.goalRows);
  const budgetStatus = useBudgetStore((s) => s.status);
  const budgetLoadedKey = useBudgetStore((s) => s.loadedKey);

  const bills = useUtilitiesStore((s) => s.bills);
  const settlements = useUtilitiesStore((s) => s.settlements);
  const utilitiesStatus = useUtilitiesStore((s) => s.status);

  const savings = useSavingsStore((s) => s.savings);
  const investments = useSavingsStore((s) => s.investments);
  const savingsStatus = useSavingsStore((s) => s.status);
  const savingsLoadedWalletId = useSavingsStore((s) => s.loadedWalletId);

  const meters = useMetersStore((s) => s.meters);
  const orders = useBusinessStore((s) => s.orders);

  const debts = useDebtsStore((s) => s.debts);
  const insurancePolicies = useInsuranceStore((s) => s.budgetPolicies);
  const insuranceUpcoming = useInsuranceStore((s) => s.upcoming);
  const insuranceStatus = useInsuranceStore((s) => s.status);
  const rentalOverdueRents = useRentalStore((s) => s.overdueRents);
  const rentalStatus = useRentalStore((s) => s.status);
  const rentalLoadedPeriod = useRentalStore((s) => s.loadedPeriod);
  const debtsStatus = useDebtsStore((s) => s.status);
  const debtsLoadedWalletId = useDebtsStore((s) => s.loadedWalletId);

  const pocketMoneyMembers = usePocketMoneyStore((s) => s.members);
  const pocketMoneyStatus = usePocketMoneyStore((s) => s.status);
  const pocketMoneyLoadedPeriod = usePocketMoneyStore((s) => s.loadedPeriod);

  const receivablesSummary = useReceivablesStore((s) => s.summary);
  const receivablesStatus = useReceivablesStore((s) => s.status);

  const metersStatus = useMetersStore((s) => s.status);
  const metersLoadedHouseholdId = useMetersStore((s) => s.loadedHouseholdId);

  const businessStatus = useBusinessStore((s) => s.status);
  const businessLoadedHouseholdId = useBusinessStore((s) => s.loadedHouseholdId);

  const aiUtilityAnomalies = useUtilitiesStore((s) => s.aiUtilityAnomalies);
  const setAiUtilityAnomalies = useUtilitiesStore((s) => s.setAiUtilityAnomalies);

  const { handlePayItem, isReader } = useDashboardPayActions();

  useEnsureExchangeRates(needsExchangeRatesOnDashboard(user));

  const moduleFetchCtx = useMemo(
    () => ({
      activeWalletId,
      householdId: householdId ?? null,
      selectedMonth,
      selectedYear,
    }),
    [activeWalletId, householdId, selectedMonth, selectedYear],
  );

  useEffect(() => {
    if (!user) return;
    void ensureModulesLoaded(user, DASHBOARD_MODULE_IDS, moduleFetchCtx, {
      priority: DASHBOARD_FETCH_PRIORITY,
    });
  }, [moduleFetchCtx, user]);

  useEffect(() => {
    if (!canLoadUtilityAnomalies(user)) return;
    let cancelled = false;
    void ensureUtilityAnomaliesLoaded(selectedYear, selectedMonth).then((data) => {
      if (!cancelled) setAiUtilityAnomalies(data);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedMonth, selectedYear, setAiUtilityAnomalies, user]);

  const isAdmin = user?.role === 'admin';
  const canUse = useCallback(
    (mod: string) => canUseModuleWithTier(user, mod as ModuleId),
    [user],
  );
  const businessEnabled = canUse('business');
  const utilitySplitConfigured =
    user?.household?.utility_split_enabled ?? user?.household?.utility_split_enabled ?? false;
  const utilitySplitEnabled =
    canUse('utilities') && utilitySplitConfigured && canUseFeature(user, 'utility_split');
  const utilityLabels = useMemo(() => utilitiesCalculations.resolveSplitLabels(user), [user]);
  const { onHouseholdSide, partnerId, counterpartyLabel } = utilityLabels;
  const businessName = user?.household?.business_name ?? user?.household?.business_name ?? 'Vállalkozás';
  const householdName = user?.household?.name || 'Otthon';
  const householdMembers = user?.household?.users || [];
  const { greeting, GreetingIcon } = useMemo(() => dashboardGreeting(), []);
  const todayFormatted = dashboardTodayFormatted();
  const todayStr = todayDate();
  const manualBalance = activeWalletManualBalance(user);

  const goalsReadyForMetrics = budgetLoadedKey === `${activeWalletId}-${selectedYear}-${selectedMonth}`;
  const categories = user?.household?.categories?.length
    ? user.household.categories
    : ['Fizetés', 'Élelmiszer', 'Rezsi'];
  const debtsSettings = useMemo(() => resolveDebtsSettings(user?.household), [user?.household]);
  const insuranceSettings = useMemo(() => resolveInsuranceSettings(user?.household), [user?.household]);
  const rentalSettings = useMemo(() => resolveRentalSettings(user?.household), [user?.household]);
  const pocketMoneySettings = useMemo(() => resolvePocketMoneySettings(user?.household), [user?.household]);
  const businessSettings = useMemo(() => resolveBusinessSettings(user?.household), [user?.household]);
  const budgetSettings = useMemo(() => resolveBudgetSettings(user?.household), [user?.household]);
  const dashboardSettings = useMemo(() => resolveDashboardSettings(user?.household), [user?.household]);

  const dashboardWidgetOrder = useMemo(
    () => filterDashboardWidgetOrder(dashboardSettings.widget_order, user),
    [dashboardSettings.widget_order, user],
  );

  const metersSettings = useMemo(() => resolveMetersSettings(user?.household), [user?.household]);

  const missingMeters = useMemo(() => {
    if (!canUseModuleWithTier(user, 'utilities')) return [];
    const reminderDay = metersSettings.reading_reminder_day || 0;
    if (reminderDay === 0) return [];
    
    const todayObj = toDayjs(todayDate());
    const currentMonth = todayObj.month() + 1;
    const currentYear = todayObj.year();
    const currentDay = todayObj.date();
    
    if (currentDay < reminderDay) return [];
    
    return meters.filter(m => !m.readings.some(r => r.year === currentYear && r.month === currentMonth));
  }, [meters, metersSettings.reading_reminder_day, user]);
  const periodLabel = useMemo(
    () => formatMonthYear(selectedMonth, selectedYear),
    [selectedMonth, selectedYear],
  );
  const pocketMoneyInterestAlert = useMemo(() => {
    if (!canUseModuleWithTier(user, 'pocket_money')) return null;
    return computeDashboardPocketMoneyInterestAlert(
      pocketMoneyMembers,
      pocketMoneySettings,
      periodLabel,
      selectedYear,
      selectedMonth,
    );
  }, [pocketMoneyMembers, pocketMoneySettings, periodLabel, selectedMonth, selectedYear, user]);

  const businessTaxAlert = useMemo(() => {
    if (!canUseModuleWithTier(user, 'business')) return null;
    return computeDashboardBusinessTaxAlert(orders, selectedYear, businessSettings);
  }, [businessSettings, orders, selectedYear, user]);

  const debtInstallments = useDebtBudgetInstallments({
    debts,
    user,
    selectedYear,
    selectedMonth,
    categories,
    paymentCategoryPattern: debtsSettings.payment_category_pattern,
    enabled: goalsReadyForMetrics && canUse('budget') && canUse('debts'),
  });

  const insurancePremiums = useInsuranceBudgetPremiums({
    policies: insurancePolicies,
    user,
    selectedYear,
    selectedMonth,
    categories,
    paymentCategoryPattern: insuranceSettings.payment_category_pattern,
    enabled: goalsReadyForMetrics && canUse('budget') && canUse('insurance'),
  });

  const syncedPremiumExpenses = useMemo(
    () => [...debtInstallments, ...insurancePremiums],
    [debtInstallments, insurancePremiums],
  );

  const { summary: missedIncomeSummary } = useMissedIncomeSummary({
    walletId: activeWalletId,
    selectedYear,
    throughMonth: selectedMonth,
    enabled: canUse('budget') && activeWalletId !== null,
    missedIncomeEnabled: budgetSettings.missed_income_enabled,
    graceDays: budgetSettings.missed_income_grace_days,
  });

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
    extraMonthExpenses: debtInstallments,
  });

  const lockedSavings = useMemo(
    () =>
      canUse('savings')
        ? budgetCalculations.calculateLockedSavings(savings, investments, exchangeRates)
        : 0,
    [canUse, exchangeRates, investments, savings],
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
        budgetStatus,
        budgetLoadedKey,
        utilitiesStatus,
        savingsStatus,
        savingsLoadedWalletId,
        debtsStatus,
        debtsLoadedWalletId,
        householdId,
        insuranceStatus,
        rentalStatus,
        rentalLoadedPeriod,
        pocketMoneyStatus,
        pocketMoneyLoadedPeriod,
        metersStatus,
        metersLoadedHouseholdId,
        businessStatus,
        businessLoadedHouseholdId,
        receivablesStatus,
      }),
    [
      activeWalletId,
      budgetLoadedKey,
      budgetStatus,
      businessLoadedHouseholdId,
      businessStatus,
      canUse,
      debtsLoadedWalletId,
      debtsStatus,
      householdId,
      insuranceStatus,
      rentalStatus,
      rentalLoadedPeriod,
      metersLoadedHouseholdId,
      metersStatus,
      pocketMoneyLoadedPeriod,
      pocketMoneyStatus,
      savingsLoadedWalletId,
      savingsStatus,
      selectedMonth,
      selectedYear,
      utilitiesStatus,
      receivablesStatus,
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
      debtInstallments: syncedPremiumExpenses,
      selectedMonth,
      selectedYear,
      exchangeRates,
      onHouseholdSide,
      partnerId,
      todayStr,
    });

    const aiCfoContext: AiCfoContextPayload | null =
      canLoadDashboardAiCfo(user) && activeWalletId !== null && financialDataReady
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
    syncedPremiumExpenses,
    selectedMonth,
    selectedYear,
    exchangeRates,
    onHouseholdSide,
    partnerId,
    todayStr,
    activeWalletId,
    financialDataReady,
    user,
  ]);

  return {
    user,
    activeWalletId,
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
    missedIncomeSummary,
    receivablesOutstanding: receivablesSummary.totalOutstanding,
    receivablesOpenContactCount: receivablesSummary.openContactCount,
    insuranceUpcoming,
    insuranceReminderDays: insuranceSettings.reminder_days_before,
    rentalOverdueRents,
    rentalOverdueGraceDays: rentalSettings.overdue_grace_days,
    pocketMoneyInterestAlert,
    businessTaxAlert,
    aiUtilityAnomalies,
    canLoadUtilityAnomalies: canLoadUtilityAnomalies(user),
    periodLabel,
    dashboardWidgetOrder,
    missingMeters,
    metersShowAnnualOnDashboard: metersSettings.show_annual_summary_on_dashboard,
    ...snapshot,
  };
}
