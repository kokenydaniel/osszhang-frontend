import { aiFinanceClient } from '@/lib/api-client';
import { aiHelpers } from '@/helpers/ai-helpers';
import { StatusCodes } from '@/types/api';
import type { AiCashflowForecast, AiCostReduction, AiOverspendAnalysis } from '@/types/ai';

type BudgetAiInsights = {
  overspend: AiOverspendAnalysis | null;
  forecast: AiCashflowForecast | null;
};

const inflightInsights = new Map<string, Promise<BudgetAiInsights>>();
const cachedInsights = new Map<string, BudgetAiInsights>();

const inflightCostReduction = new Map<string, Promise<AiCostReduction | null>>();
const cachedCostReduction = new Map<string, AiCostReduction | null>();

export function buildBudgetAiInsightsKey(walletId: number, year: number, month: number): string {
  return `${walletId}:${year}:${month}`;
}

export function clearBudgetAiInsightsCache(): void {
  cachedInsights.clear();
  cachedCostReduction.clear();
}

export function clearBudgetAiInsightsLoaderCache(): void {
  inflightInsights.clear();
  inflightCostReduction.clear();
  clearBudgetAiInsightsCache();
}

/**
 * Budget AI (túlköltés + forecast) — egyszer tölt wallet/hónap kombinációnként,
 * duplikált mount (pl. React Strict Mode) és párhuzamos hívók ellen.
 */
export async function ensureBudgetAiInsightsLoaded(
  walletId: number,
  year: number,
  month: number,
  options?: { silent?: boolean; force?: boolean },
): Promise<BudgetAiInsights | null> {
  const key = buildBudgetAiInsightsKey(walletId, year, month);

  if (!options?.force) {
    const cached = cachedInsights.get(key);
    if (cached) return cached;
    const inflight = inflightInsights.get(key);
    if (inflight) return inflight;
  }

  const promise = (async () => {
    const [overspend, forecast] = await Promise.all([
      aiHelpers.getOverspendRootCause(year, month, walletId, options),
      aiHelpers.getCashflowForecast(year, month, walletId, options),
    ]);
    const result = { overspend, forecast };
    cachedInsights.set(key, result);
    return result;
  })().finally(() => {
    inflightInsights.delete(key);
  });

  inflightInsights.set(key, promise);
  return promise;
}

/** Spórolási javaslat — ugyanaz a cache logika. */
export async function ensureCostReductionLoaded(
  walletId: number,
  year: number,
  month: number,
  options?: { force?: boolean },
): Promise<AiCostReduction | null> {
  const key = buildBudgetAiInsightsKey(walletId, year, month);

  if (!options?.force) {
    if (cachedCostReduction.has(key)) {
      return cachedCostReduction.get(key) ?? null;
    }
    const inflight = inflightCostReduction.get(key);
    if (inflight) return inflight;
  }

  const promise = (async () => {
    try {
      const res = await aiFinanceClient.costReductionSuggestions({
        year,
        month,
        walletId,
      });
      if (!res || res[0] !== StatusCodes.Http200) return null;
      const payload = res[1].data;
      cachedCostReduction.set(key, payload);
      return payload;
    } catch {
      return null;
    }
  })().finally(() => {
    inflightCostReduction.delete(key);
  });

  inflightCostReduction.set(key, promise);
  return promise;
}
