'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useSavingsStore } from '@/stores/savingsStore';
import { isStoreLoading } from '@/utils/loadable-status';
import { savingsClient, investmentsClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { savingsCalculations } from '@/calculations/savings';
import { resolveSavingsSettings } from '@/settings/savings';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { usePeriodStore } from '@/stores/usePeriodStore';
import { useExchangeRatesStore } from '@/stores/useExchangeRatesStore';
import { formatHUF } from '@/utils';
import { isHouseholdReader } from '@/utils/household-role';
import { PiggyBank, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { HELP } from '@/config/help';
import type { MetricItem } from '@/components/design';
import type { CreateSavingsPayload, Investment, SavingsAccount } from '@/types';
import { fetchExchangeRates } from '@/utils/exchange-rates';

export function useSavingsPageData() {
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const { user } = useAuthStore();
  const { selectedMonth, selectedYear } = usePeriodStore();
  const exchangeRates = useExchangeRatesStore((s) => s.rates);
  const setExchangeRates = useExchangeRatesStore((s) => s.setRates);

  const savings = useSavingsStore((s) => s.savings);
  const investments = useSavingsStore((s) => s.investments);
  const status = useSavingsStore((s) => s.status);
  const setSavings = useSavingsStore((s) => s.setSavings);
  const setInvestments = useSavingsStore((s) => s.setInvestments);
  const loading = isStoreLoading(status);

  useEffect(() => {
    void useSavingsStore.getState().fetch(activeWalletId);
  }, [activeWalletId]);

  useEffect(() => {
    void fetchExchangeRates().then(setExchangeRates);
  }, [setExchangeRates]);

  const refresh = useCallback(() => {
    void useSavingsStore.getState().fetch(activeWalletId, true);
  }, [activeWalletId]);

  const savingsSettings = useMemo(
    () => resolveSavingsSettings(user?.household),
    [user?.household],
  );
  const separateOwner = savingsSettings.separate_owner.trim();
  const isReader = isHouseholdReader(user);

  const convertToHUF = useCallback(
    (amount: number, currency: string) => (exchangeRates[currency] || 1) * amount,
    [exchangeRates],
  );

  const formatCurrencyAmount = useCallback((amount: number, currency: string): string => {
    if (currency === 'HUF') return formatHUF(amount);
    const maxFractionDigits = currency === 'BTC' || currency === 'ETH' ? 8 : 2;
    return `${amount.toLocaleString('hu-HU', { maximumFractionDigits: maxFractionDigits })} ${currency}`;
  }, []);

  const accounts = useMemo(() => savings.filter((s) => s.type === 'account'), [savings]);
  const goals = useMemo(() => savings.filter((s) => s.type === 'goal'), [savings]);

  const personalAccounts = useMemo(
    () => (separateOwner ? accounts.filter((s) => s.owner !== separateOwner) : accounts),
    [accounts, separateOwner],
  );
  const wifeAccounts = useMemo(
    () => (separateOwner ? accounts.filter((s) => s.owner === separateOwner) : []),
    [accounts, separateOwner],
  );
  const personalInvestments = useMemo(
    () => (separateOwner ? investments.filter((i) => i.owner !== separateOwner) : investments),
    [investments, separateOwner],
  );
  const wifeInvestments = useMemo(
    () => (separateOwner ? investments.filter((i) => i.owner === separateOwner) : []),
    [investments, separateOwner],
  );

  const sumPersonalInvestments = useMemo(
    () =>
      personalInvestments
        .filter((i) => i.countInSavings !== false)
        .reduce((sum, inv) => sum + savingsCalculations.computeInvestmentValue(inv).totalValue, 0),
    [personalInvestments],
  );
  const sumWifeInvestments = useMemo(
    () =>
      wifeInvestments
        .filter((i) => i.countInSavings !== false)
        .reduce((sum, inv) => sum + savingsCalculations.computeInvestmentValue(inv).totalValue, 0),
    [wifeInvestments],
  );

  const sumPersonal = useMemo(
    () =>
      [...personalAccounts, ...goals.filter((g) => !separateOwner || g.owner !== separateOwner)]
        .filter((s) => s.count_in_savings !== false)
        .reduce((sum, acc) => sum + convertToHUF(savingsCalculations.computeBalance(acc), acc.currency), 0) +
      sumPersonalInvestments,
    [personalAccounts, goals, separateOwner, convertToHUF, sumPersonalInvestments],
  );
  const sumWife = useMemo(
    () =>
      [...wifeAccounts, ...goals.filter((g) => separateOwner && g.owner === separateOwner)]
        .filter((s) => s.count_in_savings !== false)
        .reduce((sum, acc) => sum + convertToHUF(savingsCalculations.computeBalance(acc), acc.currency), 0) +
      sumWifeInvestments,
    [wifeAccounts, goals, separateOwner, convertToHUF, sumWifeInvestments],
  );

  const savingsMetrics = useMemo((): MetricItem[] => [
    {
      label: separateOwner ? 'Saját + Közös' : 'Megtakarítások',
      value: formatHUF(sumPersonal),
      info: HELP.savings.personal,
      hint: `${personalAccounts.length} számla · ${goals.length} cél · ${personalInvestments.length} papír`,
      icon: Wallet,
      tone: 'primary',
      emphasis: true,
    },
    ...(separateOwner
      ? [
          {
            label: separateOwner,
            value: formatHUF(sumWife),
            info: HELP.savings.wife,
            hint: `${wifeAccounts.length} számla · ${wifeInvestments.length} papír`,
            icon: PiggyBank,
            tone: 'info' as const,
          },
        ]
      : []),
    {
      label: 'Teljes vagyon',
      value: formatHUF(sumPersonal + sumWife),
      info: HELP.savings.totalWealth,
      hint: 'Számlák és állampapírok',
      icon: TrendingUp,
      tone: 'success',
      emphasis: true,
    },
    {
      label: 'Befektetési arány',
      value:
        sumPersonal + sumWife > 0
          ? `${Math.round(((sumPersonalInvestments + sumWifeInvestments) / (sumPersonal + sumWife)) * 100)}%`
          : '0%',
      info: HELP.savings.investRatio,
      hint: `${formatHUF(sumPersonalInvestments + sumWifeInvestments)} állampapír`,
      icon: Sparkles,
      tone: 'default',
    },
  ], [
    separateOwner,
    sumPersonal,
    sumWife,
    sumPersonalInvestments,
    sumWifeInvestments,
    personalAccounts.length,
    goals.length,
    personalInvestments.length,
    wifeAccounts.length,
    wifeInvestments.length,
  ]);

  const getAccountById = useCallback(
    (id: number) => savings.find((s) => s.id === id) ?? null,
    [savings],
  );

  const addSavingsAccount = useCallback(
    async (payload: CreateSavingsPayload): Promise<SavingsAccount> => {
      const res = await savingsClient.create({
        type: payload.type,
        institution: payload.institution,
        currency: payload.currency,
        owner: payload.owner,
        count_in_savings: payload.count_in_savings ?? true,
        goal_amount: payload.goalAmount,
        current_amount: payload.currentAmount,
        target_date: payload.targetDate,
        wallet_id: payload.walletId ?? activeWalletId,
      });
      if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
        throw new Error('Hiba történt a létrehozás során');
      }
      if (!activeWalletId) throw new Error();
      setSavings([...savings, res[1]], activeWalletId);
      return res[1];
    },
    [activeWalletId, savings, setSavings],
  );

  const updateSavingsAccount = useCallback(
    async (id: number, partial: Partial<Omit<SavingsAccount, 'id' | 'ledger'>>) => {
      const optimistic = savings.find((s) => s.id === id);
      if (optimistic) {
        if (activeWalletId) {
          setSavings(savings.map((s) => (s.id === id ? { ...optimistic, ...partial } : s)), activeWalletId);
        }
      }
      try {
        const res = await savingsClient.update(id, {
          type: partial.type,
          institution: partial.institution,
          currency: partial.currency,
          owner: partial.owner,
          count_in_savings: partial.count_in_savings,
          goal_amount: partial.goalAmount,
          current_amount: partial.currentAmount,
          target_date: partial.targetDate,
          wallet_id: partial.walletId,
        });
        if (!res || res[0] !== StatusCodes.Http200) throw new Error();
        if (activeWalletId) setSavings(savings.map((s) => (s.id === id ? res[1] : s)), activeWalletId);
      } catch (err) {
        if (optimistic && activeWalletId) {
          setSavings(savings.map((s) => (s.id === id ? optimistic : s)), activeWalletId);
        }
        throw err;
      }
    },
    [activeWalletId, savings, setSavings],
  );

  const deleteSavingsAccount = useCallback(
    async (id: number) => {
      const res = await savingsClient.delete(id);
      if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http204)) {
        throw new Error();
      }
      if (!activeWalletId) throw new Error();
      setSavings(savings.filter((s) => s.id !== id), activeWalletId);
    },
    [activeWalletId, savings, setSavings],
  );

  const saveLedgerEntry = useCallback(
    async (
      savingsId: number,
      entry: { date: string; amount: number; reason: string },
      editingLedgerId: number | null,
    ): Promise<SavingsAccount> => {
      let updated: SavingsAccount;
      if (editingLedgerId) {
        const res = await savingsClient.updateEntry(savingsId, editingLedgerId, entry);
        if (!res || res[0] !== StatusCodes.Http200) throw new Error();
        updated = res[1];
      } else {
        const res = await savingsClient.addEntry(savingsId, entry);
        if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
          throw new Error();
        }
        updated = res[1];
      }
      if (!activeWalletId) throw new Error();
      setSavings(savings.map((s) => (s.id === savingsId ? updated : s)), activeWalletId);
      return updated;
    },
    [activeWalletId, savings, setSavings],
  );

  const deleteLedgerEntry = useCallback(
    async (savingsId: number, entryId: number) => {
      const res = await savingsClient.deleteEntry(savingsId, entryId);
      if (!res || res[0] !== StatusCodes.Http200) throw new Error();
      if (!activeWalletId) throw new Error();
      setSavings(savings.map((s) => (s.id === savingsId ? res[1] : s)), activeWalletId);
    },
    [activeWalletId, savings, setSavings],
  );

  const addInvestment = useCallback(
    async (data: Omit<Investment, 'id'>) => {
      const res = await investmentsClient.create(data);
      if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
        throw new Error();
      }
      setInvestments([...investments, res[1]]);
    },
    [investments, setInvestments],
  );

  const updateInvestment = useCallback(
    async (id: number, data: Partial<Omit<Investment, 'id'>>) => {
      const { patchInvestment, investments: current } = useSavingsStore.getState();
      const previous = current.find((i) => i.id === id);
      if (previous) patchInvestment(id, { ...previous, ...data });
      try {
        const res = await investmentsClient.update(id, data);
        if (!res || res[0] !== StatusCodes.Http200) throw new Error();
        patchInvestment(id, res[1]);
      } catch (err) {
        if (previous) patchInvestment(id, previous);
        throw err;
      }
    },
    [],
  );

  const deleteInvestment = useCallback(
    async (id: number) => {
      const res = await investmentsClient.delete(id);
      if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http204)) {
        throw new Error();
      }
      setInvestments(investments.filter((i) => i.id !== id));
    },
    [investments, setInvestments],
  );

  return {
    user,
    activeWalletId,
    savings,
    investments,
    loading,
    refresh,
    isReader,
    savingsSettings,
    separateOwner,
    accounts,
    goals,
    personalAccounts,
    wifeAccounts,
    personalInvestments,
    wifeInvestments,
    savingsMetrics,
    sumPersonalInvestments,
    sumWifeInvestments,
    convertToHUF,
    formatCurrencyAmount,
    getInvestmentValue: savingsCalculations.computeInvestmentValue,
    getMaturityAmount: savingsCalculations.computeMaturityAmount,
    getAccountById,
    selectedMonth,
    selectedYear,
    addSavingsAccount,
    updateSavingsAccount,
    deleteSavingsAccount,
    saveLedgerEntry,
    deleteLedgerEntry,
    addInvestment,
    updateInvestment,
    deleteInvestment,
  };
}
