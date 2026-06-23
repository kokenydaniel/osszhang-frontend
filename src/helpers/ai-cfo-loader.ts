import { aiHelpers } from '@/helpers/ai-helpers';
import { buildAiCfoCacheKey } from '@/helpers/ai-cfo-cache';
import { useDashboardStore } from '@/stores/useDashboardStore';
import type { AiCfoBrief, AiCfoContextPayload } from '@/types';

const inflightLoads = new Map<string, Promise<{ brief: AiCfoBrief | null; errorMessage: string | null }>>();

export function buildAiCfoDataFingerprint(payload: AiCfoContextPayload): string {
  const categories = payload.top_spending_categories
    .map((c) => `${c.category}:${c.amount}`)
    .sort()
    .join('|');
  const goals = payload.savings_goals
    .map((g) => `${g.title}:${g.remaining_amount}`)
    .sort()
    .join('|');
  const debts = payload.debts
    .map((d) => `${d.name}:${d.remaining}`)
    .sort()
    .join('|');

  return [
    payload.total_balance,
    payload.total_pending,
    payload.disposable_remaining,
    payload.overdue_total,
    payload.income_received,
    payload.spent_this_month,
    payload.monthly_balance,
    payload.locked_savings,
    payload.total_debts,
    categories,
    goals,
    debts,
  ].join(';');
}

export function buildAiCfoCacheKeyFromPayload(payload: AiCfoContextPayload): string {
  return buildAiCfoCacheKey(
    payload.wallet_id,
    payload.year,
    payload.month,
    buildAiCfoDataFingerprint(payload),
  );
}

export async function ensureAiCfoAdviceLoaded(
  payload: AiCfoContextPayload,
  options?: { force?: boolean; silent?: boolean },
): Promise<{ brief: AiCfoBrief | null; errorMessage: string | null }> {
  const key = buildAiCfoCacheKeyFromPayload(payload);
  const store = useDashboardStore.getState();

  if (!options?.force && store.aiCfoCacheKey === key && store.aiCfoAdvice) {
    return { brief: store.aiCfoAdvice, errorMessage: null };
  }

  const existing = inflightLoads.get(key);
  if (existing && !options?.force) {
    return existing;
  }

  const promise = aiHelpers.getAiCfo(payload, { silent: options?.silent ?? true })
    .then(({ brief, errorMessage }) => {
      if (brief) {
        useDashboardStore.getState().setAiCfoAdvice(key, brief);
        return { brief, errorMessage: null as string | null };
      }
      return { brief: null, errorMessage };
    })
    .finally(() => {
      inflightLoads.delete(key);
    });

  inflightLoads.set(key, promise);
  return promise;
}

export function clearAiCfoAdviceCache(): void {
  useDashboardStore.getState().clearAiCfoAdvice();
}

export function clearAiCfoLoaderCache(): void {
  inflightLoads.clear();
  clearAiCfoAdviceCache();
}
