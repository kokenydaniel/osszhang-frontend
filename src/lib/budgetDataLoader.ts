import type { RequestOptions } from '@/lib/api-client/response';
import { BudgetService } from '@/services/BudgetService';
import { isWalletTransactionsReady, useBudgetStore } from '@/stores/useBudgetStore';

const inflightLoads = new Map<string, Promise<void>>();

export function clearBudgetDataLoaderCache(): void {
  inflightLoads.clear();
}

function loadKey(walletId: number, year: number, month: number, scope: 'full' | 'goals') {
  return `${scope}:${walletId}:${year}:${month}`;
}

export async function ensureBudgetGoalsLoaded(
  walletId: number,
  month: number,
  year: number,
  options?: RequestOptions,
): Promise<void> {
  const store = useBudgetStore.getState();
  const goalsReady =
    store.loadedWalletId === walletId &&
    store.loadedMonth === month &&
    store.loadedYear === year &&
    !store.isLoadingGoals;

  if (goalsReady) return;

  const key = loadKey(walletId, year, month, 'goals');
  const existing = inflightLoads.get(key);
  if (existing) return existing;

  const promise = (async () => {
    store.setIsLoadingGoals(true);
    try {
      const res = await BudgetService.fetchGoalRows(walletId, month, year, options);
      useBudgetStore.getState().setGoalRows(res.data, month, year, walletId);
    } catch (error) {
      useBudgetStore.getState().setIsLoadingGoals(false);
      throw error;
    }
  })().finally(() => {
    inflightLoads.delete(key);
  });

  inflightLoads.set(key, promise);
  return promise;
}

/**
 * Loads wallet transactions and goal rows for a period.
 * Deduplicates concurrent callers (preload + page hook) and uses a single API
 * round-trip when both datasets are needed.
 */
export async function ensureBudgetPeriodLoaded(
  walletId: number,
  month: number,
  year: number,
  options?: RequestOptions,
): Promise<void> {
  const store = useBudgetStore.getState();
  const txReady = isWalletTransactionsReady(walletId, store.loadedWalletId, store.isLoading);
  const goalsReady =
    txReady &&
    store.loadedMonth === month &&
    store.loadedYear === year &&
    !store.isLoadingGoals;

  if (txReady && goalsReady) return;

  if (txReady && !goalsReady) {
    return ensureBudgetGoalsLoaded(walletId, month, year, options);
  }

  const key = loadKey(walletId, year, month, 'full');
  const existing = inflightLoads.get(key);
  if (existing) return existing;

  const promise = (async () => {
    store.setIsLoading(true);
    store.setIsLoadingGoals(true);
    try {
      const res = await BudgetService.fetchPeriod(walletId, month, year, options);
      useBudgetStore.getState().setTransactions(res.data.transactions, walletId);
      useBudgetStore.getState().setGoalRows(res.data.goalRows, month, year, walletId);
    } catch (error) {
      const latest = useBudgetStore.getState();
      latest.setIsLoading(false);
      latest.setIsLoadingGoals(false);
      throw error;
    }
  })().finally(() => {
    inflightLoads.delete(key);
  });

  inflightLoads.set(key, promise);
  return promise;
}
