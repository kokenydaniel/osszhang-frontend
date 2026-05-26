'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { today } from '@/lib/dates';
import { useDebtsStore } from '@/stores/useDebtsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useDebtsUi } from '@/components/modules/debts/DebtsUiContext';
import { debtsService, DebtsService, type DebtWithPayoff } from '@/services/DebtsService';
import { AiFinanceService } from '@/services/AiFinanceService';
import { BudgetService } from '@/services/BudgetService';
import { matchPaymentCategory, resolveDebtsSettings } from '@/lib/debtsSettings';
import { isHouseholdReader, canEditHousehold } from '@/lib/householdRole';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { isAbortError } from '@/lib/api-client/abortError';
import { formatHUF } from '@/utils';
import type { Debt } from '@/types';

export type { DebtWithPayoff };

export function useDebtsLogic() {
  const {
    debts,
    aiDebtPlan,
    isLoading,
    loadedWalletId,
    setDebts,
    setAiDebtPlan,
    setLoading,
    patchDebt,
    appendDebt,
    removeDebt,
  } = useDebtsStore();

  const ui = useDebtsUi();
  const { user } = useAuthStore();
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const { categories } = useBudgetStore();
  const { selectedYear, selectedMonth } = usePreferenceStore();
  const { addNotification } = useNotificationStore();
  const { requestDelete, ConfirmDeleteModal } = useConfirmDelete();
  const pathname = usePathname();

  const debtsSettings = useMemo(() => resolveDebtsSettings(user?.household), [user?.household]);
  const isReader = isHouseholdReader(user);

  useEffect(() => {
    if (activeWalletId === null) return;
    if (loadedWalletId === activeWalletId && !isLoading) return;
    if (!pathname.startsWith('/debts')) return;

    let cancelled = false;
    const loadDebts = async () => {
      setLoading(true, activeWalletId);
      try {
        const nextDebts = await debtsService.fetchAll(activeWalletId, { silent: true });
        if (!cancelled) {
          setDebts(nextDebts, activeWalletId);
        }
      } catch (error) {
        if (!isAbortError(error) && !cancelled) {
          console.error('[useDebtsLogic] fetch failed', error);
          setLoading(false);
        }
      }
    };

    void loadDebts();
    return () => {
      cancelled = true;
    };
  }, [activeWalletId, isLoading, loadedWalletId, pathname, setDebts, setLoading]);

  useEffect(() => {
    ui.syncPayCategory(categories, debtsSettings.payment_category_pattern);
  }, [categories, debtsSettings.payment_category_pattern, ui]);

  useEffect(() => {
    ui.applyHouseholdDefaults(debtsSettings);
  }, [debtsSettings, ui]);

  const debtsWithPayoff = useMemo(() => DebtsService.enrichWithPayoff(debts), [debts]);

  const summary = useMemo(
    () => DebtsService.buildSummaryMetrics(debts, debtsWithPayoff),
    [debts, debtsWithPayoff],
  );

  const metrics = useMemo(
    () => DebtsService.buildMetricStrip(summary, debtsWithPayoff.length),
    [summary, debtsWithPayoff.length],
  );

  const orderedDebts = useMemo(
    () => DebtsService.orderByAiSchedule(debtsWithPayoff, aiDebtPlan),
    [aiDebtPlan, debtsWithPayoff],
  );

  const focusDebt = orderedDebts[0];

  const acceleration = useMemo(() => {
    if (!focusDebt || ui.extraMonthly <= 0) return null;
    return DebtsService.computeAcceleration(
      focusDebt.remaining,
      focusDebt.annualInterestRate,
      focusDebt.minimumPayment,
      ui.extraMonthly,
    );
  }, [focusDebt, ui.extraMonthly]);

  const openForm = useCallback(
    (debt?: Debt) => {
      if (!canEditHousehold(user)) return;
      ui.openDebtForm(debt);
    },
    [ui, user],
  );

  const openPayModal = useCallback(
    (debt: Debt) => {
      if (!canEditHousehold(user)) return;
      const payCategory =
        categories.length > 0
          ? matchPaymentCategory(categories, debtsSettings.payment_category_pattern)
          : ui.payCategory;
      ui.openPayModal({
        debt,
        payAmount: debt.minimumPayment ? String(debt.minimumPayment) : '',
        payDate: today(),
        payNote: `${debt.name} törlesztés`,
        payAddToBudget: debtsSettings.pay_add_to_budget_default,
        payCategory,
      });
    },
    [categories, debtsSettings, ui, user],
  );

  const saveDebt = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!canEditHousehold(user)) return;

      const payload = DebtsService.buildDebtFormPayload({
        name: ui.name,
        targetAmount: ui.targetAmount,
        paidAmount: ui.paidAmount,
        annualInterestRate: ui.annualInterestRate,
        minimumPayment: ui.minimumPayment,
        dueDay: ui.dueDay,
      });

      try {
        if (ui.editId) {
          const updated = await debtsService.update(ui.editId, payload);
          patchDebt(ui.editId, updated);
          addNotification('Tartozás frissítve.', 'success');
        } else {
          const created = await debtsService.create(payload, activeWalletId);
          appendDebt(created);
          addNotification('Tartozás létrehozva.', 'success');
        }
        ui.closeDebtForm();
      } catch {
        addNotification('A tartozás mentése nem sikerült.', 'error');
      }
    },
    [activeWalletId, addNotification, appendDebt, patchDebt, ui, user],
  );

  const recordPayment = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!canEditHousehold(user)) return;

      const { payDebt, payAmount, payDate, payNote, payAddToBudget, payCategory } = ui;
      if (!payDebt) return;

      const amt = DebtsService.parsePaymentAmount(payAmount);
      if (amt === null) {
        addNotification('Adj meg egy érvényes pozitív összeget.', 'error');
        return;
      }

      ui.setPaySaving(true);
      try {
        const updatePayload = DebtsService.buildPaymentUpdate(payDebt, amt);
        const updated = await debtsService.update(payDebt.id, updatePayload);
        patchDebt(payDebt.id, updated);

        // TODO: Refactor to Event Bus for cross-domain side effects
        if (payAddToBudget && payCategory) {
          const res = await BudgetService.createTransaction({
            type: 'expense',
            description: payNote || `${payDebt.name} törlesztés`,
            category: payCategory,
            amount: amt,
            dueDate: payDate,
            paidDate: payDate,
            isBudget: false,
            isReserve: false,
            walletId: activeWalletId ?? undefined,
          });
          const budgetStore = useBudgetStore.getState();
          if (budgetStore.loadedWalletId !== null) {
            budgetStore.setTransactions(
              [...budgetStore.transactions, res.data],
              budgetStore.loadedWalletId,
            );
          }
        }

        addNotification(
          `${formatHUF(amt)} törlesztés rögzítve${payAddToBudget ? ' (költségvetésben is)' : ''}.`,
          'success',
        );
        ui.closePayModal();
      } catch (err) {
        console.error(err);
        addNotification('Nem sikerült rögzíteni a törlesztést.', 'error');
      } finally {
        ui.setPaySaving(false);
      }
    },
    [activeWalletId, addNotification, patchDebt, ui, user],
  );

  const deleteDebt = useCallback(
    async (id: number) => {
      try {
        await debtsService.remove(id);
        removeDebt(id);
        addNotification('Tartozás törölve.', 'success');
      } catch {
        addNotification('A tartozás törlése nem sikerült.', 'error');
      }
    },
    [addNotification, removeDebt],
  );

  const requestAiOptimize = useCallback(async () => {
    ui.setIsAiLoading(true);
    try {
      const plan = await AiFinanceService.getDebtOptimizationPlan(ui.strategy, activeWalletId);
      if (plan) {
        setAiDebtPlan(plan);
      } else {
        addNotification('Az AI sorrend generálása nem sikerült.', 'error');
      }
    } finally {
      ui.setIsAiLoading(false);
    }
  }, [activeWalletId, addNotification, setAiDebtPlan, ui]);

  return {
    isReader,
    debtsWithPayoff,
    totalDebt: summary.totalDebt,
    monthlyMinimum: summary.monthlyMinimum,
    metrics,
    farthestPayoff: summary.farthestPayoff,
    totalInterestRemaining: summary.totalInterestRemaining,
    aiDebtPlan,
    strategy: ui.strategy,
    setStrategy: ui.setStrategy,
    isAiLoading: ui.isAiLoading,
    requestAiOptimize,
    orderedDebts,
    focusDebt,
    extraMonthly: ui.extraMonthly,
    setExtraMonthly: ui.setExtraMonthly,
    acceleration,
    openForm,
    openPayModal,
    deleteDebt,
    requestDelete,
    saveDebt,
    recordPayment,
    categories,
    selectedYear,
    selectedMonth,
    ConfirmDeleteModal,
  };
}

export type DebtsLogicResult = ReturnType<typeof useDebtsLogic>;
