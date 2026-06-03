import type { ModuleId } from '@/helpers/module-access';
import { LoadableStatus, isStoreLoading } from '@/utils/loadable-status';
import {
  isBudgetPeriodReady,
  isHouseholdResourceReady,
  isInsuranceDataReady,
  isRentalPeriodReady,
  isPocketMoneyPeriodReady,
  isUtilitiesLoaded,
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
  householdId: number | null | undefined;
  insuranceStatus: LoadableStatus;
  rentalStatus: LoadableStatus;
  rentalLoadedPeriod: string | null;
  pocketMoneyStatus: LoadableStatus;
  pocketMoneyLoadedPeriod: string | null;
  metersStatus: LoadableStatus;
  metersLoadedHouseholdId: number | null;
  businessStatus: LoadableStatus;
  businessLoadedHouseholdId: number | null;
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
    if (!isUtilitiesLoaded(utilitiesStatus)) return false;
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

  if (needs('insurance')) {
    if (!isInsuranceDataReady(insuranceStatus)) return false;
  }

  if (needs('rental')) {
    if (!isRentalPeriodReady(selectedYear, selectedMonth, rentalLoadedPeriod, rentalStatus)) {
      return false;
    }
  }

  if (needs('pocket_money')) {
    if (
      !isPocketMoneyPeriodReady(selectedYear, selectedMonth, pocketMoneyLoadedPeriod, pocketMoneyStatus)
    ) {
      return false;
    }
  }

  if (needs('meters')) {
    if (!isHouseholdResourceReady(householdId, metersLoadedHouseholdId, metersStatus)) {
      return false;
    }
  }

  if (needs('business')) {
    if (!isHouseholdResourceReady(householdId, businessLoadedHouseholdId, businessStatus)) {
      return false;
    }
  }

  return true;
}
