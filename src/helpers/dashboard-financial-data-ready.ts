import type { ModuleId } from '@/helpers/module-access';
import { LoadableStatus, isStoreLoading } from '@/utils/loadable-status';
import {
  isBudgetPeriodReady,
  isWalletDebtsReady,
  isWalletSavingsReady,
} from '@/helpers/store-ready';

type CanUseModule = (mod: string) => boolean;

export function isDashboardFinancialDataReady(params: {
  activeWalletId: number | null;
  canUse: CanUseModule;
  selectedMonth: number;
  selectedYear: number;
  budgetStatus: LoadableStatus;
  budgetLoadedKey: string | null;
  utilitiesStatus: LoadableStatus;
  savingsStatus: LoadableStatus;
  savingsLoadedWalletId: number | null;
  debtsStatus: LoadableStatus;
  debtsLoadedWalletId: number | null;
}): boolean {
  const {
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
  } = params;

  if (activeWalletId === null) return false;

  const needs = (mod: ModuleId) => canUse(mod);

  if (needs('budget')) {
    if (
      !isBudgetPeriodReady(activeWalletId, selectedYear, selectedMonth, budgetStatus, budgetLoadedKey)
    ) {
      return false;
    }
  }

  if (needs('utilities')) {
    if (isStoreLoading(utilitiesStatus)) return false;
  }

  if (needs('savings')) {
    if (!isWalletSavingsReady(activeWalletId, savingsLoadedWalletId, savingsStatus)) {
      return false;
    }
  }

  if (needs('debts')) {
    if (!isWalletDebtsReady(activeWalletId, debtsLoadedWalletId, debtsStatus)) {
      return false;
    }
  }

  return true;
}
