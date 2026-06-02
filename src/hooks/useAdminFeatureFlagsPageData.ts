'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminStore } from '@/stores/useAdminStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { adminClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { formatFeatureFlagLabel, featureFlagsToRecord } from '@/helpers/admin-helpers';
import { getApiErrorMessage } from '@/lib/api-client';
import { isAbortError } from '@/lib/api-client/abortError';

export function useAdminFeatureFlagsPageData() {
  const {
    featureFlags,
    featureFlagsLoading,
    featureFlagsLoaded,
    setFeatureFlags,
    patchFeatureFlag,
    setFeatureFlagsLoading,
    setFeatureFlagsLoaded,
  } = useAdminStore();

  const { addNotification } = useNotificationStore();
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const refreshFeatureFlags = useCallback(async () => {
    setFeatureFlagsLoading(true);
    try {
      const res = await adminClient.listFeatureFlags({ silent: true });
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      setFeatureFlags(featureFlagsToRecord(res[1].data ?? []));
      setFeatureFlagsLoaded(true);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('[useAdminFeatureFlagsPageData] listFeatureFlags failed', error);
        addNotification('A rendszer funkciók betöltése nem sikerült.', 'error');
      }
    } finally {
      setFeatureFlagsLoading(false);
    }
  }, [addNotification, setFeatureFlags, setFeatureFlagsLoaded, setFeatureFlagsLoading]);

  useEffect(() => {
    if (featureFlagsLoaded || featureFlagsLoading) return;
    void refreshFeatureFlags();
  }, [featureFlagsLoaded, featureFlagsLoading, refreshFeatureFlags]);

  const featureFlagList = useMemo(
    () => Object.values(featureFlags).sort((a, b) => a.key.localeCompare(b.key)),
    [featureFlags],
  );

  const toggleFeatureFlag = useCallback(
    async (key: string, nextValue: boolean) => {
      const previous = featureFlags[key]?.value;
      setTogglingKey(key);
      patchFeatureFlag(key, nextValue);

      try {
        const res = await adminClient.updateFeatureFlag(key, nextValue);
        if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
        const updated = res[1].data;
        patchFeatureFlag(key, updated.value);
        addNotification(
          `${formatFeatureFlagLabel(key)} ${nextValue ? 'bekapcsolva' : 'kikapcsolva'}.`,
          'success',
        );

        if (key === 'beta_mode') {
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            useAuthStore.setState({ user: { ...currentUser, beta_mode: nextValue } });
          }
        }
      } catch (error) {
        if (previous !== undefined) {
          patchFeatureFlag(key, previous);
        }
        addNotification(
          getApiErrorMessage(error, 'A funkció kapcsoló mentése nem sikerült.'),
          'error',
        );
      } finally {
        setTogglingKey(null);
      }
    },
    [addNotification, featureFlags, patchFeatureFlag],
  );

  return {
    featureFlags: featureFlagList,
    isFeatureFlagsLoading: featureFlagsLoading && !featureFlagsLoaded,
    isFeatureFlagsRefreshing: featureFlagsLoading && featureFlagsLoaded,
    togglingKey,
    refreshFeatureFlags,
    toggleFeatureFlag,
  };
}
