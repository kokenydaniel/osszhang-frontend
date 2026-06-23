import { aiHelpers } from '@/helpers/ai-helpers';
import type { AiUtilityAnomalies } from '@/types';

const inflightLoads = new Map<string, Promise<AiUtilityAnomalies | null>>();
const cachedResults = new Map<string, AiUtilityAnomalies | null>();

export function buildUtilityAnomaliesKey(year: number, month: number): string {
  return `${year}:${month}`;
}

export function clearUtilityAnomaliesCache(): void {
  cachedResults.clear();
}

export function clearUtilityAnomaliesLoaderCache(): void {
  inflightLoads.clear();
  clearUtilityAnomaliesCache();
}

export async function ensureUtilityAnomaliesLoaded(
  year: number,
  month: number,
  options?: { force?: boolean },
): Promise<AiUtilityAnomalies | null> {
  const key = buildUtilityAnomaliesKey(year, month);

  if (!options?.force) {
    if (cachedResults.has(key)) {
      return cachedResults.get(key) ?? null;
    }
    const inflight = inflightLoads.get(key);
    if (inflight) return inflight;
  }

  const promise = aiHelpers
    .getUtilityAnomalies(year, month)
    .then((result) => {
      cachedResults.set(key, result);
      return result;
    })
    .finally(() => {
      inflightLoads.delete(key);
    });

  inflightLoads.set(key, promise);
  return promise;
}
