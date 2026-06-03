import { LoadableStatus, isStoreLoading } from '@/utils/loadable-status';

export function budgetPeriodKey(walletId: number, year: number, month: number): string {
  return `${walletId}-${year}-${month}`;
}

export function isBudgetPeriodReady(
  walletId: number | null,
  year: number,
  month: number,
  status: LoadableStatus,
  loadedKey: string | null,
): boolean {
  if (walletId === null) return false;
  return !isStoreLoading(status) && loadedKey === budgetPeriodKey(walletId, year, month);
}

export function isWalletDebtsReady(
  activeWalletId: number | null,
  loadedWalletId: number | null,
  status: LoadableStatus,
): boolean {
  return activeWalletId !== null && status === LoadableStatus.Loaded && loadedWalletId === activeWalletId;
}

export function isWalletSavingsReady(
  activeWalletId: number | null,
  loadedWalletId: number | null,
  status: LoadableStatus,
): boolean {
  return activeWalletId !== null && status === LoadableStatus.Loaded && loadedWalletId === activeWalletId;
}

export function isUtilitiesLoaded(status: LoadableStatus): boolean {
  return status === LoadableStatus.Loaded;
}

export function isHouseholdResourceReady(
  householdId: number | null | undefined,
  loadedHouseholdId: number | null,
  status: LoadableStatus,
): boolean {
  if (householdId == null) return false;
  return status === LoadableStatus.Loaded && loadedHouseholdId === householdId;
}

export function isPocketMoneyPeriodReady(
  year: number,
  month: number,
  loadedPeriod: string | null,
  status: LoadableStatus,
): boolean {
  const key = `${year}-${month}`;
  return status === LoadableStatus.Loaded && loadedPeriod === key;
}

export function isInsuranceDataReady(status: LoadableStatus): boolean {
  return status === LoadableStatus.Loaded;
}

export function isRentalPeriodReady(
  year: number,
  month: number,
  loadedPeriod: string | null,
  status: LoadableStatus,
): boolean {
  const key = `${year}-${month}`;
  return status === LoadableStatus.Loaded && loadedPeriod === key;
}
