'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useAdminStore } from '@/stores/useAdminStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { adminClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { isAbortError } from '@/lib/api-client/abortError';
import config from '@/config/config';
import type { AdminHouseholdTierFilter } from '@/types/admin';

export type AdminHouseholdsQueryState = {
  search: string;
  tierFilter: AdminHouseholdTierFilter;
  page: number;
};

export function useAdminHouseholdsPageData(queryState: AdminHouseholdsQueryState) {
  const {
    households,
    householdsMeta,
    householdsLoading,
    householdsLoaded,
    setHouseholdsPage,
    setHouseholdsLoading,
    setHouseholdsLoaded,
  } = useAdminStore();
  const { addNotification } = useNotificationStore();

  const query = useMemo(
    () => ({
      search: queryState.search.trim() || undefined,
      tier: queryState.tierFilter,
      page: queryState.page,
      perPage: config.pagination.adminUsersPerPage,
    }),
    [queryState.page, queryState.search, queryState.tierFilter],
  );

  const refreshHouseholds = useCallback(async () => {
    setHouseholdsLoading(true);
    try {
      const res = await adminClient.listHouseholds(query, { silent: true });
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      setHouseholdsPage(res[1].data ?? [], res[1].meta);
      setHouseholdsLoaded(true);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('[useAdminHouseholdsPageData] fetch failed', error);
        addNotification('A háztartások betöltése nem sikerült.', 'error');
      }
    } finally {
      setHouseholdsLoading(false);
    }
  }, [addNotification, query, setHouseholdsLoaded, setHouseholdsLoading, setHouseholdsPage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshHouseholds();
    }, queryState.search ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [queryState.search, refreshHouseholds]);

  return {
    households,
    meta: householdsMeta,
    isLoading: householdsLoading && !householdsLoaded,
    isRefreshing: householdsLoading && householdsLoaded,
    refreshHouseholds,
  };
}
