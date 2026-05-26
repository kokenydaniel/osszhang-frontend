'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSavingsStore } from '@/stores/useSavingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useSavingsUi } from '@/components/modules/savings/SavingsUiContext';
import { savingsService, SavingsService } from '@/services/SavingsService';
import type { CreateSavingsPayload } from '@/services/SavingsService';
import { resolveSavingsSettings } from '@/lib/savingsSettings';
import { formatHUF } from '@/utils';
import { isAbortError } from '@/lib/api-client/abortError';
import { isHouseholdReader, canEditHousehold } from '@/lib/householdRole';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useAsyncAction, usePendingIds } from '@/hooks/useAsyncAction';
import { PiggyBank, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { HELP } from '@/lib/helpTexts';
import type { MetricItem } from '@/components/design';
import type { SavingsAccount, Investment, LedgerEntry } from '@/types';

// TODO: Refactor to Event Bus for cross-domain side effects
import { refreshBudgetGoalRows } from '@/lib/walletDataSync';
import { fetchExchangeRates } from '@/lib/exchangeRates';

/**
 * useSavingsLogic — the orchestration hook for the Savings module.
 *
 * Responsibilities:
 *  1. Triggers data fetching via SavingsService on mount / wallet change
 *  2. Updates useSavingsStore (the global data cache) with results
 *  3. Reads UI state from SavingsUiContext (not the store)
 *  4. Derives computed values (metrics, partitioned lists) from store data
 *  5. Exposes typed action callbacks for CRUD mutations
 *
 * Must be called inside a <SavingsUiProvider> subtree.
 */
export function useSavingsLogic() {
  // ── Global store (server data cache) ────────────────────────────────────────
  const {
    savings,
    investments,
    isLoading: walletLoading,
    loadedWalletId,
    setSavings,
    setInvestments,
    setLoading,
    patchSavingsItem,
    appendSavingsItem,
    removeSavingsItem,
    patchInvestment,
    appendInvestment,
    removeInvestment,
  } = useSavingsStore();

  // ── Global stores (cross-cutting) ────────────────────────────────────────────
  const { user } = useAuthStore();
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const { exchangeRates, setExchangeRates, selectedMonth, selectedYear } = usePreferenceStore();

  // ── Module-scoped UI context ─────────────────────────────────────────────────
  const ui = useSavingsUi();

  // ── Utilities ────────────────────────────────────────────────────────────────
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const { pending: ledgerSaving, run: runLedgerSave } = useAsyncAction();
  const { pending: assetSaving, run: runAssetSave } = useAsyncAction();
  const { wrap: wrapSavingsPending, isPending: isSavingsPending } = usePendingIds();
  const pathname = usePathname();
  const isReader = isHouseholdReader(user);

  // ── Fetch exchange rates on mount ────────────────────────────────────────────
  useEffect(() => {
    void fetchExchangeRates().then(setExchangeRates);
  }, [setExchangeRates]);

  // ── Fetch savings data when the active wallet changes ─────────────────────────
  useEffect(() => {
    if (activeWalletId === null || !pathname.startsWith('/savings')) return;
    if (loadedWalletId === activeWalletId && !walletLoading) return;

    let cancelled = false;
    const doFetch = async () => {
      setLoading(true, activeWalletId);
      try {
        const { accounts, seq } = await savingsService.fetchAll(activeWalletId, {
          silent: true,
        });
        if (cancelled || seq !== savingsService.currentSeq) return;
        setSavings(accounts, activeWalletId);
      } catch (err) {
        if (isAbortError(err) || cancelled) return;
        console.error('[useSavingsLogic] fetchAll error', err);
        setLoading(false);
      }
    };

    void doFetch();
    return () => {
      cancelled = true;
    };
  }, [activeWalletId, loadedWalletId, pathname, setLoading, setSavings, walletLoading]);

  // ── Fetch investments on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!pathname.startsWith('/savings')) return;
    void savingsService.fetchInvestments({ silent: true }).then(setInvestments);
  }, [pathname, setInvestments]);

  // ── Derived data ──────────────────────────────────────────────────────────────
  const savingsSettings = useMemo(
    () => resolveSavingsSettings(user?.household),
    [user?.household],
  );
  const separateOwner = savingsSettings.separate_owner.trim();

  const convertToHUF = useCallback(
    (amount: number, currency: string) => (exchangeRates[currency] || 1) * amount,
    [exchangeRates],
  );

  const formatCurrencyAmount = useCallback(
    (amount: number, currency: string): string => {
      if (currency === 'HUF') return formatHUF(amount);
      const maxFractionDigits = currency === 'BTC' || currency === 'ETH' ? 8 : 2;
      return `${amount.toLocaleString('hu-HU', { maximumFractionDigits: maxFractionDigits })} ${currency}`;
    },
    [],
  );

  // Partition accounts and investments by owner
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

  // Compute totals
  const sumPersonalInvestments = useMemo(
    () =>
      personalInvestments
        .filter((i) => i.countInSavings !== false)
        .reduce((sum, inv) => sum + SavingsService.computeInvestmentValue(inv).totalValue, 0),
    [personalInvestments],
  );
  const sumWifeInvestments = useMemo(
    () =>
      wifeInvestments
        .filter((i) => i.countInSavings !== false)
        .reduce((sum, inv) => sum + SavingsService.computeInvestmentValue(inv).totalValue, 0),
    [wifeInvestments],
  );
  const sumPersonal = useMemo(
    () =>
      [...personalAccounts, ...goals.filter((g) => !separateOwner || g.owner !== separateOwner)]
        .filter((s) => s.count_in_savings !== false)
        .reduce((sum, acc) => sum + convertToHUF(SavingsService.computeBalance(acc), acc.currency), 0) +
      sumPersonalInvestments,
    [personalAccounts, goals, separateOwner, convertToHUF, sumPersonalInvestments],
  );
  const sumWife = useMemo(
    () =>
      [...wifeAccounts, ...goals.filter((g) => separateOwner && g.owner === separateOwner)]
        .filter((s) => s.count_in_savings !== false)
        .reduce((sum, acc) => sum + convertToHUF(SavingsService.computeBalance(acc), acc.currency), 0) +
      sumWifeInvestments,
    [wifeAccounts, goals, separateOwner, convertToHUF, sumWifeInvestments],
  );

  // Metric strip data
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
    separateOwner, sumPersonal, sumWife, sumPersonalInvestments, sumWifeInvestments,
    personalAccounts.length, goals.length, personalInvestments.length,
    wifeAccounts.length, wifeInvestments.length,
  ]);

  // Ledger-modal derived data (from UI context)
  const selectedAccount = useMemo(
    () => savings.find((s) => s.id === ui.selectedSavings),
    [savings, ui.selectedSavings],
  );
  const ledgerCurrency = selectedAccount?.currency ?? 'HUF';
  const ledgerItems = selectedAccount?.ledger ?? [];

  // ── Status ────────────────────────────────────────────────────────────────────
  const walletDataReady =
    activeWalletId !== null && !walletLoading && loadedWalletId === activeWalletId;

  // ── Mutation Actions ──────────────────────────────────────────────────────────

  const addSavingsAccount = useCallback(async (payload: CreateSavingsPayload): Promise<void> => {
    await runAssetSave(async () => {
      const created = await savingsService.create(payload);
      appendSavingsItem(created);
    });
  }, [appendSavingsItem, runAssetSave]);

  const updateSavingsAccount = useCallback(
    async (id: number, partial: Partial<Omit<SavingsAccount, 'id' | 'ledger'>>): Promise<void> => {
      // Optimistic update
      const prev = useSavingsStore.getState().savings;
      const optimistic = prev.find((s) => s.id === id);
      if (optimistic) patchSavingsItem(id, { ...optimistic, ...partial });

      try {
        const updated = await savingsService.update(id, partial);
        patchSavingsItem(id, updated);
      } catch (err) {
        // Rollback
        if (optimistic) patchSavingsItem(id, optimistic);
        throw err;
      }
    },
    [patchSavingsItem],
  );

  const deleteSavingsAccount = useCallback(
    async (id: number): Promise<void> => {
      await savingsService.remove(id);
      removeSavingsItem(id);
    },
    [removeSavingsItem],
  );

  const handleLedgerSubmit = useCallback(async (): Promise<void> => {
    if (!canEditHousehold(useAuthStore.getState().user)) return;

    await runLedgerSave(async () => {
      const {
        selectedSavings,
        ledgerAmount,
        ledgerType,
        ledgerReason,
        ledgerDate,
        editingLedgerId,
      } = ui;

      if (!selectedSavings) return;

      const cleanAmount = ledgerAmount.replace(',', '.');
      const amt = ledgerType === 'deposit' ? Number(cleanAmount) : -Number(cleanAmount);

      let updated: SavingsAccount;
      if (editingLedgerId) {
        updated = await savingsService.updateEntry(selectedSavings, editingLedgerId, {
          date: ledgerDate,
          amount: amt,
          reason: ledgerReason,
        });
      } else {
        updated = await savingsService.addEntry(selectedSavings, {
          date: ledgerDate,
          amount: amt,
          reason: ledgerReason,
        });
      }

      patchSavingsItem(selectedSavings, updated);
      ui.clearLedgerForm();
      refreshBudgetGoalRows();
    });
  }, [patchSavingsItem, runLedgerSave, ui]);

  const deleteLedgerEntry = useCallback(
    async (savingsId: number, entryId: number): Promise<void> => {
      const updated = await savingsService.removeEntry(savingsId, entryId);
      patchSavingsItem(savingsId, updated);
      // TODO: Refactor to Event Bus for cross-domain side effects
      refreshBudgetGoalRows();
    },
    [patchSavingsItem],
  );

  const handleDeleteLedgerEntry = useCallback(
    (item: LedgerEntry, ledgerCurrencyLocal: string) => {
      requestDelete({
        title: 'Tétel törlése',
        message: `Biztosan törlöd a „${item.reason}" tételt (${formatCurrencyAmount(item.amount, ledgerCurrencyLocal)})?`,
        onConfirm: () => {
          if (!ui.selectedSavings) return;
          void deleteLedgerEntry(ui.selectedSavings, item.id);
          if (ui.editingLedgerId === item.id) ui.clearLedgerForm();
        },
      });
    },
    [requestDelete, deleteLedgerEntry, ui, formatCurrencyAmount],
  );

  const addInvestment = useCallback(
    async (data: Omit<Investment, 'id'>): Promise<void> => {
      await runAssetSave(async () => {
        const created = await savingsService.createInvestment(data);
        appendInvestment(created);
      });
    },
    [appendInvestment, runAssetSave],
  );

  const updateInvestment = useCallback(
    async (id: number, data: Partial<Omit<Investment, 'id'>>): Promise<void> => {
      const prev = useSavingsStore.getState().investments;
      const optimistic = prev.find((i) => i.id === id);
      if (optimistic) patchInvestment(id, { ...optimistic, ...data });

      try {
        const updated = await savingsService.updateInvestment(id, data);
        patchInvestment(id, updated);
      } catch (err) {
        if (optimistic) patchInvestment(id, optimistic);
        throw err;
      }
    },
    [patchInvestment],
  );

  const deleteInvestment = useCallback(
    async (id: number): Promise<void> => {
      await savingsService.removeInvestment(id);
      removeInvestment(id);
    },
    [removeInvestment],
  );

  const saveInvestmentValue = useCallback(
    (invId: number): void => {
      if (!canEditHousehold(useAuthStore.getState().user)) return;
      void updateInvestment(invId, { currentValue: Number(ui.editingInvValue) });
      ui.cancelEditInvestmentValue();
    },
    [updateInvestment, ui],
  );

  const saveInvestmentPayout = useCallback(
    (invId: number): void => {
      if (!canEditHousehold(useAuthStore.getState().user)) return;
      void updateInvestment(invId, {
        nextPayoutAmount: Number(ui.editingPayoutAmount),
        nextPayoutDate: ui.editingPayoutDate || null,
      });
      ui.setEditingPayoutInvId(null);
    },
    [updateInvestment, ui],
  );

  // ── Return value ──────────────────────────────────────────────────────────────
  return {
    // ── Data ──────────────────────────────────────────────────────────────────
    savings,
    investments,
    accounts,
    goals,
    personalAccounts,
    wifeAccounts,
    personalInvestments,
    wifeInvestments,
    separateOwner,
    savingsSettings,

    // ── Computed metrics & helpers ─────────────────────────────────────────────
    savingsMetrics,
    sumPersonalInvestments,
    sumWifeInvestments,
    convertToHUF,
    formatCurrencyAmount,

    // Delegate domain computations to the service static methods
    getInvestmentValue: SavingsService.computeInvestmentValue,
    getMaturityAmount: SavingsService.computeMaturityAmount,

    // ── Status ─────────────────────────────────────────────────────────────────
    walletDataReady,
    isReader,
    ledgerSaving,
    assetSaving,
    wrapSavingsPending,
    isSavingsPending,

    // ── Ledger modal (derived from UI context) ─────────────────────────────────
    ledgerCurrency,
    ledgerItems,

    // ── Account mutations ──────────────────────────────────────────────────────
    addSavingsAccount,
    updateSavingsAccount,
    deleteSavingsAccount,
    handleLedgerSubmit,
    deleteLedgerEntry,
    handleDeleteLedgerEntry,

    // ── Investment mutations ───────────────────────────────────────────────────
    addInvestment,
    updateInvestment,
    deleteInvestment,
    saveInvestmentValue,
    saveInvestmentPayout,

    // ── UI context passthrough (for components that need it) ───────────────────
    requestDelete,
    ConfirmDeleteModal,

    // Preference
    selectedMonth,
    selectedYear,
  };
}

export type SavingsLogicResult = ReturnType<typeof useSavingsLogic>;
