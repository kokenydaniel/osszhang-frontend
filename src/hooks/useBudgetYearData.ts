'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { budgetClient } from '@/lib/api-client';
import { budgetYearCalculations } from '@/calculations/budget-year';
import { utilitiesCalculations } from '@/calculations/utilities';
import { canUseModuleWithTier } from '@/helpers/module-access';
import { canUseFeature } from '@/helpers/check-access';
import { resolveDebtsSettings } from '@/settings/debts';
import { useAuthStore } from '@/stores/useAuthStore';
import { useDebtsStore } from '@/stores/debtsStore';
import { useInsuranceStore } from '@/stores/insuranceStore';
import { resolveInsuranceSettings } from '@/settings/insurance';
import { useSavingsStore } from '@/stores/savingsStore';
import { useUtilitiesStore } from '@/stores/utilitiesStore';
import { StatusCodes } from '@/types/api';
import type { CashTransaction } from '@/types';
import { useExchangeRatesStore } from '@/stores/useExchangeRatesStore';
import { useEnsureExchangeRates } from '@/hooks/useEnsureExchangeRates';

export function useBudgetYearData(params: {
  activeWalletId: number | null;
  selectedYear: number;
  enabled: boolean;
}) {
  const { activeWalletId, selectedYear, enabled } = params;
  const { user } = useAuthStore();
  useEnsureExchangeRates();
  const exchangeRates = useExchangeRatesStore((s) => s.rates);
  const bills = useUtilitiesStore((s) => s.bills);
  const debts = useDebtsStore((s) => s.debts);
  const insurancePolicies = useInsuranceStore((s) => s.budgetPolicies);
  const savings = useSavingsStore((s) => s.savings);

  const canUseDebts = canUseModuleWithTier(user, 'debts');
  const canUseInsurance = canUseModuleWithTier(user, 'insurance');
  const canUseSavings = canUseModuleWithTier(user, 'savings');

  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [goalRows, setGoalRows] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const categories = user?.household?.categories?.length
    ? user.household.categories
    : ['Fizetés', 'Élelmiszer', 'Rezsi'];
  const debtsSettings = useMemo(() => resolveDebtsSettings(user?.household), [user?.household]);
  const insuranceSettings = useMemo(() => resolveInsuranceSettings(user?.household), [user?.household]);

  const utilitySplitConfigured =
    user?.household?.utility_split_enabled ?? user?.household?.utility_split_enabled ?? false;
  const utilitySplitEnabled = utilitySplitConfigured && canUseFeature(user, 'utility_split');
  const partnerId =
    user?.household?.utility_split_partner_id ?? user?.household?.utility_split_partner_id;
  const onHouseholdSide = utilitiesCalculations.isHouseholdSide(user?.id, partnerId);

  const getBillPortion = useCallback(
    (bill: import('@/types').UtilityBill) =>
      utilitiesCalculations.budgetBillPortion(bill, onHouseholdSide, utilitySplitEnabled),
    [onHouseholdSide, utilitySplitEnabled],
  );

  const walletDebts = useMemo(() => {
    if (activeWalletId === null) return debts;
    return debts.filter((debt) => debt.walletId === null || debt.walletId === activeWalletId);
  }, [activeWalletId, debts]);

  const walletSavings = useMemo(() => {
    if (activeWalletId === null) return savings;
    return savings.filter(
      (account) => account.walletId === null || account.walletId === activeWalletId,
    );
  }, [activeWalletId, savings]);

  const loadKey = activeWalletId !== null ? `${activeWalletId}-${selectedYear}` : null;

  const refresh = useCallback(async () => {
    if (!activeWalletId) return;
    setLoading(true);
    try {
      const monthIndexes = Array.from({ length: 12 }, (_, index) => index + 1);
      const [allRes, ...goalResults] = await Promise.all([
        budgetClient.getAll(activeWalletId, { silent: true }),
        ...monthIndexes.map((month) =>
          budgetClient.getGoalRows(activeWalletId, month, selectedYear, { silent: true }),
        ),
      ]);

      if (!allRes || allRes[0] !== StatusCodes.Http200) throw new Error('API Error');

      const mergedGoals = goalResults.flatMap((res) =>
        res && res[0] === StatusCodes.Http200 ? (res[1] ?? []) : [],
      );

      setTransactions(allRes[1].transactions ?? []);
      setGoalRows(mergedGoals);
      setLoadedKey(`${activeWalletId}-${selectedYear}`);
    } catch {
      setTransactions([]);
      setGoalRows([]);
      setLoadedKey(null);
    } finally {
      setLoading(false);
    }
  }, [activeWalletId, selectedYear]);

  useEffect(() => {
    if (!enabled || !activeWalletId) return;
    void refresh();
  }, [activeWalletId, enabled, selectedYear, refresh]);

  useEffect(() => {
    if (!enabled) return;
    void useUtilitiesStore.getState().fetch();
    if (activeWalletId !== null && canUseDebts) {
      void useDebtsStore.getState().fetch(activeWalletId);
    }
    if (activeWalletId !== null && canUseSavings) {
      void useSavingsStore.getState().fetch(activeWalletId);
    }
  }, [activeWalletId, canUseDebts, canUseInsurance, canUseSavings, enabled]);

  useEffect(() => {
    if (!canUseInsurance || !enabled) return;
    void useInsuranceStore.getState().fetch();
  }, [canUseInsurance, enabled]);

  const snapshot = useMemo(
    () =>
      budgetYearCalculations.computeYearSnapshot({
        transactions,
        goalRows,
        bills,
        debts: canUseDebts ? walletDebts : [],
        insurancePolicies: canUseInsurance ? insurancePolicies : [],
        insuranceCategoryPattern: insuranceSettings.payment_category_pattern,
        savings: canUseSavings ? walletSavings : [],
        year: selectedYear,
        categories,
        debtCategoryPattern: debtsSettings.payment_category_pattern,
        getBillPortion,
        includeDebts: canUseDebts,
        includeInsurance: canUseInsurance,
        includeSavings: canUseSavings,
        exchangeRates,
      }),
    [
      bills,
      canUseDebts,
      canUseInsurance,
      canUseSavings,
      categories,
      debtsSettings.payment_category_pattern,
      insurancePolicies,
      insuranceSettings.payment_category_pattern,
      exchangeRates,
      getBillPortion,
      goalRows,
      walletSavings,
      selectedYear,
      transactions,
      walletDebts,
    ],
  );

  const yearMetrics = useMemo(
    () => budgetYearCalculations.buildYearMetrics(snapshot, selectedYear),
    [selectedYear, snapshot],
  );

  const yearInsights = useMemo(
    () => budgetYearCalculations.buildYearInsights(snapshot, selectedYear),
    [selectedYear, snapshot],
  );

  return {
    loading: loading && loadedKey !== loadKey,
    snapshot,
    yearMetrics,
    yearInsights,
    refresh,
    selectedYear,
    previousYear: selectedYear - 1,
    canUseDebts,
    canUseSavings,
  };
}
