'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminStore } from '@/stores/useAdminStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { adminClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { isAbortError } from '@/lib/api-client/abortError';
import { getAuthToken } from '@/helpers/auth-token';
import { startImpersonationSession } from '@/helpers/impersonation-session';
import { resetSessionData } from '@/helpers/reset-session-data';
import { formatDisplayName } from '@/utils/person-name';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import config from '@/config/config';
import type { AdminLifetimeAdminFilter, AdminTierGrantPayload, AdminUser, AdminUserStatusFilter } from '@/types/admin';

export type AdminUsersQuery = {
  search: string;
  statusFilter: AdminUserStatusFilter;
  lifetimeAdminFilter: AdminLifetimeAdminFilter;
  page: number;
};

export function useAdminUsersPageData(queryState: AdminUsersQuery) {
  const {
    users,
    meta,
    isLoading,
    isLoaded,
    setUsersPage,
    patchUser,
    setLoading,
    setLoaded,
  } = useAdminStore();

  const { user, fetchMe, setAuthToken } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();

  const { pending: activating, run: runActivate } = useAsyncAction();
  const { pending: deactivating, run: runDeactivate } = useAsyncAction();
  const { pending: impersonating, run: runImpersonate } = useAsyncAction();
  const { pending: savingTierGrant, run: runTierGrant } = useAsyncAction();

  const query = useMemo(
    () => ({
      search: queryState.search.trim() || undefined,
      status: queryState.statusFilter,
      lifetimeAdmin: queryState.lifetimeAdminFilter,
      page: queryState.page,
      perPage: config.pagination.adminUsersPerPage,
    }),
    [queryState.lifetimeAdminFilter, queryState.page, queryState.search, queryState.statusFilter],
  );

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminClient.listUsers(query, { silent: true });
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      setUsersPage(res[1].data ?? [], res[1].meta);
      setLoaded(true);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('[useAdminUsersPageData] fetchUsers failed', error);
        addNotification('A felhasználók betöltése nem sikerült.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [addNotification, query, setLoaded, setLoading, setUsersPage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshUsers();
    }, queryState.search ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [queryState.search, refreshUsers]);

  const activateUser = useCallback(
    async (target: AdminUser): Promise<AdminUser | null> => {
      const result = await runActivate(async () => {
        try {
          const res = await adminClient.activateUser(target.id);
          if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
          const updated = res[1].data;
          patchUser(updated);
          addNotification('Felhasználó aktiválva.', 'success');
          return updated;
        } catch (error) {
          addNotification(getApiErrorMessage(error, 'Az aktiválás nem sikerült.'), 'error');
          return null;
        }
      });
      return result ?? null;
    },
    [addNotification, patchUser, runActivate],
  );

  const deactivateUser = useCallback(
    async (target: AdminUser): Promise<AdminUser | null> => {
      const result = await runDeactivate(async () => {
        try {
          const res = await adminClient.deactivateUser(target.id);
          if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
          const updated = res[1].data;
          patchUser(updated);
          addNotification('Felhasználó inaktiválva.', 'success');
          return updated;
        } catch (error) {
          addNotification(getApiErrorMessage(error, 'Az inaktiválás nem sikerült.'), 'error');
          return null;
        }
      });
      return result ?? null;
    },
    [addNotification, patchUser, runDeactivate],
  );

  const impersonateUser = useCallback(
    async (target: AdminUser): Promise<boolean> => {
      const result = await runImpersonate(async () => {
        try {
          const originToken = getAuthToken();
          if (!originToken) {
            addNotification('Nincs érvényes munkamenet.', 'error');
            return false;
          }

          const res = await adminClient.impersonateUser(target.id);
          if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
          const payload = res[1];
          const label = formatDisplayName(target.first_name, target.last_name) || target.username;

          startImpersonationSession(originToken, label);
          setAuthToken(payload.access_token);
          resetSessionData();
          useAdminStore.getState().reset();
          await fetchMe();
          addNotification(`Megszemélyesítés: ${label}`, 'info');
          router.push('/');
          return true;
        } catch (error) {
          addNotification(getApiErrorMessage(error, 'A megszemélyesítés nem sikerült.'), 'error');
          return false;
        }
      });
      return result ?? false;
    },
    [addNotification, fetchMe, router, runImpersonate, setAuthToken],
  );

  const updateTierGrant = useCallback(
    async (target: AdminUser, payload: AdminTierGrantPayload): Promise<AdminUser | null> => {
      const result = await runTierGrant(async () => {
        try {
          const res = await adminClient.updateUserTierGrant(target.id, payload);
          if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
          const updated = res[1].data;
          patchUser(updated);
          addNotification('Hozzáférési grant mentve.', 'success');
          return updated;
        } catch (error) {
          addNotification(getApiErrorMessage(error, 'A grant mentése nem sikerült.'), 'error');
          return null;
        }
      });
      return result ?? null;
    },
    [addNotification, patchUser, runTierGrant],
  );

  const canManageUser = useCallback(
    (target: AdminUser) => {
      if (!user) return false;
      if (target.id === user.id) return false;
      if (target.lifetime_admin) return false;
      return true;
    },
    [user],
  );

  const resolveUser = useCallback(
    (selected: AdminUser | null) => {
      if (!selected) return null;
      return users.find((u) => u.id === selected.id) ?? selected;
    },
    [users],
  );

  return {
    users,
    meta,
    isLoading: isLoading && !isLoaded,
    isRefreshing: isLoading && isLoaded,
    activating,
    deactivating,
    impersonating,
    savingTierGrant,
    refreshUsers,
    activateUser,
    deactivateUser,
    impersonateUser,
    updateTierGrant,
    canManageUser,
    resolveUser,
  };
}
