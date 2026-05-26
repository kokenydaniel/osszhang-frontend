import type { ModuleId } from '@/lib/moduleAccess';
import { isWalletTransactionsReady } from '@/stores/useBudgetStore';
import { isWalletDebtsReady } from '@/stores/useDebtsStore';
import { isWalletSavingsReady } from '@/stores/useSavingsStore';

type CanUseModule = (mod: string) => boolean;

export function isDashboardFinancialDataReady(params: {
  activeWalletId: number | null;
  canUse: CanUseModule;
  selectedMonth: number;
  selectedYear: number;
  budgetLoadedWalletId: number | null;
  budgetIsLoading: boolean;
  budgetIsLoadingGoals: boolean;
  budgetLoadedMonth: number | null;
  budgetLoadedYear: number | null;
  utilitiesIsLoaded: boolean;
  utilitiesIsLoading: boolean;
  savingsLoadedWalletId: number | null;
  savingsIsLoading: boolean;
  debtsLoadedWalletId: number | null;
  debtsIsLoading: boolean;
}): boolean {
  const {
    activeWalletId,
    canUse,
    selectedMonth,
    selectedYear,
    budgetLoadedWalletId,
    budgetIsLoading,
    budgetIsLoadingGoals,
    budgetLoadedMonth,
    budgetLoadedYear,
    utilitiesIsLoaded,
    utilitiesIsLoading,
    savingsLoadedWalletId,
    savingsIsLoading,
    debtsLoadedWalletId,
    debtsIsLoading,
  } = params;

  if (activeWalletId === null) return false;

  const needs = (mod: ModuleId) => canUse(mod);

  if (needs('budget')) {
    if (!isWalletTransactionsReady(activeWalletId, budgetLoadedWalletId, budgetIsLoading)) {
      return false;
    }
    if (budgetIsLoadingGoals) return false;
    if (budgetLoadedMonth !== selectedMonth || budgetLoadedYear !== selectedYear) {
      return false;
    }
  }

  if (needs('utilities')) {
    if (utilitiesIsLoading || !utilitiesIsLoaded) return false;
  }

  if (needs('savings')) {
    if (!isWalletSavingsReady(activeWalletId, savingsLoadedWalletId, savingsIsLoading)) {
      return false;
    }
  }

  if (needs('debts')) {
    if (!isWalletDebtsReady(activeWalletId, debtsLoadedWalletId, debtsIsLoading)) {
      return false;
    }
  }

  return true;
}
