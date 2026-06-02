import { aiHelpers } from '@/helpers/ai-helpers';
import type { AiOverspendAnalysis, AiCashflowForecast } from '@/types';

const inflightLoads = new Map<string, Promise<{ overspend: AiOverspendAnalysis | null; forecast: AiCashflowForecast | null }>>();
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
): Promise<{ overspend: AiOverspendAnalysis | null; forecast: AiCashflowForecast | null } | null> {
  const key = buildBudgetAiInsightsKey(walletId, year, month);

  const existing = inflightLoads.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const [overspend, forecast] = await Promise.all([
      aiHelpers.getOverspendRootCause(year, month, walletId, options),
      aiHelpers.getCashflowForecast(year, month, walletId, options),
    ]);

    return { overspend, forecast };
  })().finally(() => {
    inflightLoads.delete(key);
  });

  inflightLoads.set(key, promise);
  return promise;
}
