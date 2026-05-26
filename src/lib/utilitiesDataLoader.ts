import type { RequestOptions } from '@/lib/api-client/response';
import { utilitiesService } from '@/services/UtilitiesService';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';

let inflight: Promise<void> | null = null;

export function clearUtilitiesDataLoaderCache(): void {
  inflight = null;
}

export type UtilitiesLoadOptions = RequestOptions & {
  force?: boolean;
};

/**
 * Loads household utilities once. Concurrent callers share one in-flight request
 * instead of aborting each other.
 */
export async function ensureUtilitiesLoaded(options: UtilitiesLoadOptions = {}): Promise<void> {
  const store = useUtilitiesStore.getState();
  if (!options.force && store.isLoaded && !inflight) return;

  if (inflight && !options.force) {
    return inflight;
  }

  const promise = (async () => {
    useUtilitiesStore.getState().setLoading(true);
    try {
      const index = await utilitiesService.fetchAll({ silent: options.silent ?? true });
      useUtilitiesStore.getState().setUtilities(index);
    } catch (error) {
      useUtilitiesStore.getState().setLoading(false);
      throw error;
    }
  })().finally(() => {
    if (inflight === promise) {
      inflight = null;
    }
  });

  inflight = promise;
  return promise;
}
