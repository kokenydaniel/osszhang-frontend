import { AiFinanceService } from '@/services/AiFinanceService';
import { useBudgetStore } from '@/stores/useBudgetStore';

const inflightLoads = new Map<string, Promise<void>>();
const loadedKeys = new Set<string>();

export function buildBudgetAiInsightsKey(walletId: number, year: number, month: number): string {
  return `${walletId}:${year}:${month}`;
}

export function clearBudgetAiInsightsCache(): void {
  loadedKeys.clear();
}

export function clearBudgetAiInsightsLoaderCache(): void {
  inflightLoads.clear();
  clearBudgetAiInsightsCache();
}

/**
 * Loads budget AI insights once per wallet/period. Deduplicates concurrent callers
 * (e.g. when multiple components previously each invoked useBudgetLogic).
 */
export async function ensureBudgetAiInsightsLoaded(
  walletId: number,
  year: number,
  month: number,
  options?: { silent?: boolean; force?: boolean },
): Promise<void> {
  const key = buildBudgetAiInsightsKey(walletId, year, month);
  if (!options?.force && loadedKeys.has(key)) return;

  const existing = inflightLoads.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const [overspend, forecast] = await Promise.all([
      AiFinanceService.getOverspendRootCause(year, month, walletId, options),
      AiFinanceService.getCashflowForecast(year, month, walletId, options),
    ]);

    useBudgetStore.getState().setAiOverspend(overspend);
    useBudgetStore.getState().setAiCashflowForecast(forecast);
    loadedKeys.add(key);
  })().finally(() => {
    inflightLoads.delete(key);
  });

  inflightLoads.set(key, promise);
  return promise;
}
