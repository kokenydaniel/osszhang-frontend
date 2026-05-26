'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useUtilitiesUi } from '@/components/modules/utilities/UtilitiesUiContext';
import { utilitiesService, UtilitiesService } from '@/services/UtilitiesService';
import { AiFinanceService } from '@/services/AiFinanceService';
import { BudgetService } from '@/services/BudgetService';
import { today } from '@/lib/dates';
import { canUseFeature } from '@/lib/checkAccess';
import { isHouseholdReader, canEditHousehold } from '@/lib/householdRole';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useAsyncAction, usePendingIds } from '@/hooks/useAsyncAction';
import { isAbortError } from '@/lib/api-client/abortError';
import type { UtilityBill } from '@/types';
import type { UpdateUtilityBillPayload } from '@/mappers/utilities.mapper';

async function syncBudgetAfterSettlement(): Promise<void> {
  const activeWalletId = useWalletStore.getState().activeWalletId;
  if (activeWalletId === null) return;

  try {
    const res = await BudgetService.fetchAll(activeWalletId, { silent: true });
    useBudgetStore.getState().setTransactions(res.data.transactions, activeWalletId);
  } catch (error) {
    console.error('[useUtilitiesLogic] budget sync failed', error);
  }
}

export function useUtilitiesLogic() {
  const {
    bills,
    settlements,
    aiUtilityAnomalies,
    isLoading,
    isLoaded,
    setUtilities,
    setBills,
    setSettlements,
    setAiUtilityAnomalies,
    setLoading,
    setLoaded,
    patchBill,
    appendBill,
    removeBill,
  } = useUtilitiesStore();

  const ui = useUtilitiesUi();
  const { fetchMe, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { selectedMonth, selectedYear } = usePreferenceStore();
  const pathname = usePathname();

  const isAdmin = user?.role === 'admin';
  const isReader = isHouseholdReader(user);
  const utilitySplitConfigured =
    user?.household?.utilitySplitEnabled ?? user?.household?.utility_split_enabled ?? false;
  const utilitySplitEnabled = utilitySplitConfigured && canUseFeature(user, 'utility_split');
  const canUseAi = canUseFeature(user, 'ai');

  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const { pending: settling, run: runSettle } = useAsyncAction();
  const { pending: unsettling, run: runUnsettle } = useAsyncAction();
  const { pending: cloning, run: runClone } = useAsyncAction();
  const { pending: templating, run: runTemplates } = useAsyncAction();
  const { pending: billSaving, run: runBillSave } = useAsyncAction();
  const { wrap: wrapBillPending, isPending: isBillPending } = usePendingIds();

  const utilityLabels = useMemo(() => UtilitiesService.resolveSplitLabels(user), [user]);
  const {
    onHouseholdSide,
    partnerId,
    counterpartyLabel,
    partnerSideLabel,
    householdSideLabel,
    splitPartnerUser,
  } = utilityLabels;

  const utilityTemplates = useMemo(
    () => UtilitiesService.resolveTemplates(user?.household),
    [user?.household],
  );

  const settlementOptions = useMemo(
    () => UtilitiesService.buildSettlementOptions(onHouseholdSide, partnerSideLabel, householdSideLabel),
    [onHouseholdSide, partnerSideLabel, householdSideLabel],
  );

  useEffect(() => {
    if (!pathname.startsWith('/utilities')) return;
    if (isLoaded || isLoading) return;

    let cancelled = false;
    const loadUtilities = async () => {
      setLoading(true);
      try {
        const index = await utilitiesService.fetchAll({ silent: true });
        if (!cancelled) {
          setUtilities(index);
          setLoaded(true);
        }
      } catch (error) {
        if (!isAbortError(error) && !cancelled) {
          console.error('[useUtilitiesLogic] fetch failed', error);
          setLoading(false);
        }
      }
    };

    void loadUtilities();
    return () => {
      cancelled = true;
    };
  }, [pathname, isLoaded, isLoading, setLoading, setLoaded, setUtilities]);

  const refreshAiAnomalies = useCallback(async () => {
    const data = await AiFinanceService.getUtilityAnomalies(selectedYear, selectedMonth);
    setAiUtilityAnomalies(data);
  }, [selectedMonth, selectedYear, setAiUtilityAnomalies]);

  useEffect(() => {
    if (!canUseAi) return;
    void refreshAiAnomalies();
  }, [canUseAi, refreshAiAnomalies]);

  const filteredBills = useMemo(
    () => UtilitiesService.filterBillsByMonth(bills, selectedMonth, selectedYear),
    [bills, selectedMonth, selectedYear],
  );

  const sortedBills = useMemo(
    () => UtilitiesService.sortBillsByDueDate(filteredBills),
    [filteredBills],
  );

  const monthSettlement = useMemo(
    () => UtilitiesService.findMonthSettlement(settlements, selectedYear, selectedMonth),
    [settlements, selectedYear, selectedMonth],
  );

  const balance = useMemo(
    () => UtilitiesService.computeNetBalance(filteredBills, user?.id, partnerId, utilitySplitEnabled),
    [filteredBills, user?.id, partnerId, utilitySplitEnabled],
  );

  const {
    partnerOwesUs: partnerOwesUsTotal,
    weOwePartner: weOwePartnerTotal,
    wePaidGrandTotal,
    partnerPaidGrandTotal,
    netBalance: rawNetBalance,
  } = balance;

  const paidCount = filteredBills.filter((b) => !!b.paidDate).length;
  const totalCount = filteredBills.length;

  const metrics = useMemo(
    () =>
      UtilitiesService.buildMetricStrip({
        utilitySplitEnabled,
        monthSettlement,
        counterpartyLabel,
        rawNetBalance,
        partnerOwesUsTotal,
        weOwePartnerTotal,
        wePaidGrandTotal,
        partnerPaidGrandTotal,
        filteredBills,
        paidCount,
        totalCount,
      }),
    [
      utilitySplitEnabled,
      monthSettlement,
      counterpartyLabel,
      rawNetBalance,
      partnerOwesUsTotal,
      weOwePartnerTotal,
      wePaidGrandTotal,
      partnerPaidGrandTotal,
      filteredBills,
      paidCount,
      totalCount,
    ],
  );

  const balanceMetricAction = useMemo(
    () =>
      UtilitiesService.resolveBalanceMetricAction(
        utilitySplitEnabled,
        isAdmin,
        monthSettlement,
        rawNetBalance,
      ),
    [utilitySplitEnabled, isAdmin, monthSettlement, rawNetBalance],
  );

  const openNewBillModal = useCallback(() => {
    if (!canEditHousehold(user)) return;
    ui.openNewBillModal();
  }, [ui, user]);

  const openEditBill = useCallback(
    (bill: UtilityBill) => {
      if (!canEditHousehold(user)) return;
      ui.openEditBill(bill);
    },
    [ui, user],
  );

  const saveBill = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (isReader) return;
      if (!ui.total) return;

      await runBillSave(async () => {
        const payload = UtilitiesService.buildBillFormPayload(
          {
            type: ui.type,
            total: ui.total,
            dueDate: ui.dueDate,
            splitRule: ui.splitRule,
          },
          utilitySplitEnabled,
        );

        try {
          if (ui.editingBill) {
            const updated = await utilitiesService.update(ui.editingBill.id, payload);
            patchBill(ui.editingBill.id, updated);
            addNotification('Rezsi tétel frissítve.', 'success');
          } else {
            const created = await utilitiesService.create(payload);
            appendBill(created);
            addNotification('Rezsi tétel rögzítve.', 'success');
          }
          ui.closeBillModal();
        } catch (error) {
          console.error('[useUtilitiesLogic] saveBill failed', error);
          addNotification('A mentés nem sikerült. Próbáld újra.', 'error');
        }
      });
    },
    [addNotification, appendBill, isReader, patchBill, runBillSave, ui, utilitySplitEnabled],
  );

  const updateBill = useCallback(
    async (id: number, payload: UpdateUtilityBillPayload) => {
      const previous = bills.find((bill) => bill.id === id);
      if (!previous) return;

      const optimistic = { ...previous, ...payload };
      patchBill(id, optimistic);

      try {
        const updated = await utilitiesService.update(id, payload);
        patchBill(id, updated);
      } catch (error) {
        patchBill(id, previous);
        console.error('[useUtilitiesLogic] updateBill failed', error);
        addNotification('A frissítés nem sikerült.', 'error');
        throw error;
      }
    },
    [addNotification, bills, patchBill],
  );

  const deleteBill = useCallback(
    async (id: number) => {
      try {
        await utilitiesService.remove(id);
        removeBill(id);
        addNotification('Rezsi tétel törölve.', 'success');
      } catch (error) {
        console.error('[useUtilitiesLogic] deleteBill failed', error);
        addNotification('A törlés nem sikerült.', 'error');
      }
    },
    [addNotification, removeBill],
  );

  const clonePreviousMonth = useCallback(
    async (month: number, year: number) => {
      try {
        const index = await utilitiesService.clonePreviousMonth(month, year);
        setUtilities(index);
        addNotification('Előző hónap másolva.', 'success');
      } catch (error) {
        console.error('[useUtilitiesLogic] clonePreviousMonth failed', error);
        addNotification('A másolás nem sikerült.', 'error');
      }
    },
    [addNotification, setUtilities],
  );

  const generateFromTemplates = useCallback(() => {
    if (isReader || utilityTemplates.length === 0 || templating) return;

    void runTemplates(async () => {
      const targetMonth = selectedMonth.toString().padStart(2, '0');
      const targetYearMonth = `${selectedYear}-${targetMonth}`;
      let created = 0;

      for (const template of utilityTemplates) {
        if (UtilitiesService.templateExistsForMonth(bills, template.type, targetYearMonth)) continue;

        try {
          const payload = UtilitiesService.buildTemplateBillPayload(template, selectedYear, selectedMonth);
          const bill = await utilitiesService.create(payload);
          appendBill(bill);
          created += 1;
        } catch (error) {
          console.error('[useUtilitiesLogic] template bill failed', error);
        }
      }

      addNotification(
        created > 0 ? `${created} sablon tétel létrehozva.` : 'Minden sablon már szerepel ebben a hónapban.',
        created > 0 ? 'success' : 'info',
      );
    });
  }, [
    addNotification,
    appendBill,
    bills,
    isReader,
    runTemplates,
    selectedMonth,
    selectedYear,
    templating,
    utilityTemplates,
  ]);

  const settleMonth = useCallback(() => {
    if (!isAdmin || rawNetBalance === 0 || monthSettlement || settling) return;

    void runSettle(async () => {
      try {
        const { index, settlement } = await utilitiesService.settleMonth(selectedMonth, selectedYear);
        setBills(index.bills);
        setSettlements(index.settlements);
        await syncBudgetAfterSettlement();
        void fetchMe();
        addNotification(UtilitiesService.buildSettlementNotification(settlement), 'success');
      } catch (error) {
        console.error('[useUtilitiesLogic] settleMonth failed', error);
        addNotification('Az elszámolás nem sikerült.', 'error');
      }
    });
  }, [
    addNotification,
    fetchMe,
    isAdmin,
    monthSettlement,
    rawNetBalance,
    runSettle,
    selectedMonth,
    selectedYear,
    setBills,
    setSettlements,
    settling,
  ]);

  const unsettleMonth = useCallback(() => {
    if (!isAdmin || !monthSettlement) return;

    requestDelete({
      title: 'Elszámolás visszavonása',
      message:
        'A havi rezsi elszámolás törlődik, az aktuális egyenleg visszaáll, és a kapcsolódó költségvetési tétel is eltűnik (ha még megvan). Biztosan folytatod?',
      onConfirm: async () => {
        await runUnsettle(async () => {
          try {
            const index = await utilitiesService.unsettleMonth(selectedMonth, selectedYear);
            setBills(index.bills);
            setSettlements(index.settlements);
            await syncBudgetAfterSettlement();
            void fetchMe();
            addNotification('Elszámolás visszavonva.', 'success');
          } catch (error) {
            console.error('[useUtilitiesLogic] unsettleMonth failed', error);
            addNotification('A visszavonás nem sikerült.', 'error');
          }
        });
      },
    });
  }, [
    addNotification,
    fetchMe,
    isAdmin,
    monthSettlement,
    requestDelete,
    runUnsettle,
    selectedMonth,
    selectedYear,
    setBills,
    setSettlements,
  ]);

  const pageLoading = isLoading && !isLoaded;

  return {
    user,
    isAdmin,
    isReader,
    pageLoading,
    billSaving,
    utilitySplitEnabled,
    utilityLabels,
    utilityTemplates,
    selectedMonth,
    selectedYear,
    cloning,
    runClone,
    clonePreviousMonth,
    templating,
    generateFromTemplates,
    openNewBillModal,
    monthSettlement,
    splitPartnerUser,
    settling,
    unsettling,
    settleMonth,
    unsettleMonth,
    balanceMetricAction,
    metrics,
    aiUtilityAnomalies,
    refreshAiAnomalies,
    canUseAi,
    filteredBills,
    sortedBills,
    todayStr: today(),
    settlementOptions,
    householdSideLabel,
    partnerSideLabel,
    saveBill,
    openEditBill,
    deleteBill,
    updateBill,
    requestDelete,
    wrapBillPending,
    isBillPending,
    ConfirmDeleteModal,
  };
}

export type UtilitiesLogicResult = ReturnType<typeof useUtilitiesLogic>;
