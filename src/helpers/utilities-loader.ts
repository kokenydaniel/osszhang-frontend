import type { RequestOptions } from '@/lib/api-client/response';
import { LoadableStatus } from '@/utils/loadable-status';
import { useUtilitiesStore } from '@/stores/utilitiesStore';

let inflight: Promise<void> | null = null;

export function clearUtilitiesDataLoaderCache(): void {
  inflight = null;
}

export type UtilitiesLoadOptions = RequestOptions & {
  force?: boolean;
};

export async function ensureUtilitiesLoaded(options: UtilitiesLoadOptions = {}): Promise<void> {
  const store = useUtilitiesStore.getState();
  if (!options.force && store.status === LoadableStatus.Loaded && !inflight) return;

  if (inflight && !options.force) {
    return inflight;
  }

  const promise = useUtilitiesStore
    .getState()
    .fetch(options.force)
    .finally(() => {
      if (inflight === promise) {
        inflight = null;
      }
    });

  inflight = promise;
  return promise;
}
