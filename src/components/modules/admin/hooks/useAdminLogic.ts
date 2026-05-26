'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminStore } from '@/stores/useAdminStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAdminUi } from '@/components/modules/admin/AdminUiContext';
import { adminService } from '@/services/AdminService';
import { formatFeatureFlagLabel, featureFlagsToRecord } from '@/mappers/featureFlags.mapper';
import { getApiErrorMessage } from '@/lib/api-client';
import { isAbortError } from '@/lib/api-client/abortError';
import { getAuthToken } from '@/lib/authToken';
import { startImpersonationSession } from '@/lib/impersonationSession';
import { resetSessionData } from '@/lib/resetSessionData';
import { formatDisplayName } from '@/lib/personName';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import type { AdminUser, CreateSystemAnnouncementPayload } from '@/types/admin';

export function useAdminLogic() {
  const pathname = usePathname();
  const isUsersRoute = pathname.startsWith('/admin/users');
  const isFeaturesRoute = pathname.startsWith('/admin/features');
  const isAnnouncementsRoute = pathname.startsWith('/admin/announcements');

  const {
    users,
    meta,
    isLoading,
    isLoaded,
    featureFlags,
    featureFlagsLoading,
    featureFlagsLoaded,
    setUsersPage,
    patchUser,
    setLoading,
    setLoaded,
    setFeatureFlags,
    patchFeatureFlag,
    setFeatureFlagsLoading,
    setFeatureFlagsLoaded,
    announcements,
    announcementsLoading,
    announcementsLoaded,
    setAnnouncements,
    applyAnnouncementToggle,
    prependAnnouncement,
    setAnnouncementsLoading,
    setAnnouncementsLoaded,
  } = useAdminStore();

  const ui = useAdminUi();
  const { user, fetchMe, setAuthToken, refreshSessionQuiet } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [togglingAnnouncementId, setTogglingAnnouncementId] = useState<number | null>(null);

  const { pending: activating, run: runActivate } = useAsyncAction();
  const { pending: deactivating, run: runDeactivate } = useAsyncAction();
  const { pending: impersonating, run: runImpersonate } = useAsyncAction();
  const { pending: creatingAnnouncement, run: runCreateAnnouncement } = useAsyncAction();

  const query = useMemo(
    () => ({
      search: ui.search.trim() || undefined,
      status: ui.statusFilter,
      lifetimeAdmin: ui.lifetimeAdminFilter,
      page: ui.page,
      perPage: 25,
    }),
    [ui.search, ui.statusFilter, ui.lifetimeAdminFilter, ui.page],
  );

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    try {
      const page = await adminService.fetchUsers(query);
      setUsersPage(page.users, page.meta);
      setLoaded(true);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('[useAdminLogic] fetchUsers failed', error);
        addNotification('A felhasználók betöltése nem sikerült.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [addNotification, query, setLoaded, setLoading, setUsersPage]);

  useEffect(() => {
    if (!isUsersRoute) return;

    const timer = window.setTimeout(() => {
      void refreshUsers();
    }, ui.search ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [isUsersRoute, refreshUsers, ui.search]);

  const refreshFeatureFlags = useCallback(async () => {
    setFeatureFlagsLoading(true);
    try {
      const flags = await adminService.listFeatureFlags();
      setFeatureFlags(featureFlagsToRecord(flags));
      setFeatureFlagsLoaded(true);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('[useAdminLogic] listFeatureFlags failed', error);
        addNotification('A rendszer funkciók betöltése nem sikerült.', 'error');
      }
    } finally {
      setFeatureFlagsLoading(false);
    }
  }, [addNotification, setFeatureFlags, setFeatureFlagsLoaded, setFeatureFlagsLoading]);

  useEffect(() => {
    if (!isFeaturesRoute || featureFlagsLoaded || featureFlagsLoading) return;
    void refreshFeatureFlags();
  }, [featureFlagsLoaded, featureFlagsLoading, isFeaturesRoute, refreshFeatureFlags]);

  const refreshAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    try {
      const items = await adminService.listAnnouncements();
      setAnnouncements(items);
      setAnnouncementsLoaded(true);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('[useAdminLogic] listAnnouncements failed', error);
        addNotification('A rendszerüzenetek betöltése nem sikerült.', 'error');
      }
    } finally {
      setAnnouncementsLoading(false);
    }
  }, [addNotification, setAnnouncements, setAnnouncementsLoaded, setAnnouncementsLoading]);

  useEffect(() => {
    if (!isAnnouncementsRoute || announcementsLoaded || announcementsLoading) return;
    void refreshAnnouncements();
  }, [announcementsLoaded, announcementsLoading, isAnnouncementsRoute, refreshAnnouncements]);

  const createAnnouncement = useCallback(
    async (payload: CreateSystemAnnouncementPayload): Promise<boolean> => {
      let success = false;
      await runCreateAnnouncement(async () => {
        try {
          const created = await adminService.createAnnouncement(payload);
          prependAnnouncement(created);
          addNotification('Rendszerüzenet létrehozva. Aktiváld a közzétételhez.', 'success');
          success = true;
        } catch (error) {
          addNotification(
            getApiErrorMessage(error, 'A rendszerüzenet létrehozása nem sikerült.'),
            'error',
          );
        }
      });
      return success;
    },
    [addNotification, prependAnnouncement, runCreateAnnouncement],
  );

  const toggleAnnouncementActive = useCallback(
    async (id: number) => {
      setTogglingAnnouncementId(id);
      try {
        const updated = await adminService.toggleAnnouncementActive(id);
        applyAnnouncementToggle(updated);
        addNotification(
          updated.isActive ? 'Rendszerüzenet aktiválva.' : 'Rendszerüzenet kikapcsolva.',
          'success',
        );
        await refreshSessionQuiet();
      } catch (error) {
        addNotification(
          getApiErrorMessage(error, 'A rendszerüzenet állapotának mentése nem sikerült.'),
          'error',
        );
      } finally {
        setTogglingAnnouncementId(null);
      }
    },
    [addNotification, applyAnnouncementToggle, refreshSessionQuiet],
  );

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
        const updated = await adminService.updateFeatureFlag(key, nextValue);
        patchFeatureFlag(key, updated.value);
        addNotification(
          `${formatFeatureFlagLabel(key)} ${nextValue ? 'bekapcsolva' : 'kikapcsolva'}.`,
          'success',
        );

        if (key === 'beta_mode') {
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            useAuthStore.setState({ user: { ...currentUser, betaMode: nextValue } });
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

  const selectedUser = useMemo(() => {
    if (!ui.selectedUser) return null;
    return users.find((u) => u.id === ui.selectedUser?.id) ?? ui.selectedUser;
  }, [ui.selectedUser, users]);

  const handleActivate = useCallback(async () => {
    const target = ui.activateTarget;
    if (!target) return;

    await runActivate(async () => {
      try {
        const updated = await adminService.activateUser(target.id);
        patchUser(updated);
        addNotification('Felhasználó aktiválva.', 'success');
        ui.closeActivateModal();
        if (ui.drawerOpen && ui.selectedUser?.id === target.id) {
          ui.openUserDrawer(updated);
        }
      } catch (error) {
        addNotification(getApiErrorMessage(error, 'Az aktiválás nem sikerült.'), 'error');
      }
    });
  }, [addNotification, patchUser, runActivate, ui]);

  const handleDeactivate = useCallback(async () => {
    const target = ui.deactivateTarget;
    if (!target) return;

    await runDeactivate(async () => {
      try {
        const updated = await adminService.deactivateUser(target.id);
        patchUser(updated);
        addNotification('Felhasználó inaktiválva.', 'success');
        ui.closeDeactivateModal();
        if (ui.drawerOpen && ui.selectedUser?.id === target.id) {
          ui.openUserDrawer(updated);
        }
      } catch (error) {
        addNotification(getApiErrorMessage(error, 'Az inaktiválás nem sikerült.'), 'error');
      }
    });
  }, [addNotification, patchUser, runDeactivate, ui]);

  const handleImpersonate = useCallback(async () => {
    const target = ui.impersonateTarget;
    if (!target) return;

    await runImpersonate(async () => {
      try {
        const originToken = getAuthToken();
        if (!originToken) {
          addNotification('Nincs érvényes munkamenet.', 'error');
          return;
        }

        const result = await adminService.impersonateUser(target.id);
        const label =
          formatDisplayName(target.firstName, target.lastName) || target.username;

        startImpersonationSession(originToken, label);
        setAuthToken(result.accessToken);
        resetSessionData();
        useAdminStore.getState().reset();
        await fetchMe();
        ui.closeImpersonateModal();
        ui.closeUserDrawer();
        addNotification(`Megszemélyesítés: ${label}`, 'info');
        router.push('/');
      } catch (error) {
        addNotification(getApiErrorMessage(error, 'A megszemélyesítés nem sikerült.'), 'error');
      }
    });
  }, [addNotification, fetchMe, router, runImpersonate, setAuthToken, ui]);

  const canManageUser = useCallback(
    (target: AdminUser) => {
      if (!user) return false;
      if (target.id === user.id) return false;
      if (target.lifetimeAdmin) return false;
      return true;
    },
    [user],
  );

  return {
    users,
    meta,
    isLoading: isLoading && !isLoaded,
    isRefreshing: isLoading && isLoaded,
    selectedUser,
    activating,
    deactivating,
    impersonating,
    refreshUsers,
    handleActivate,
    handleDeactivate,
    handleImpersonate,
    canManageUser,
    featureFlags: featureFlagList,
    isFeatureFlagsLoading: featureFlagsLoading && !featureFlagsLoaded,
    isFeatureFlagsRefreshing: featureFlagsLoading && featureFlagsLoaded,
    togglingKey,
    refreshFeatureFlags,
    toggleFeatureFlag,
    announcements,
    isAnnouncementsLoading: announcementsLoading && !announcementsLoaded,
    isAnnouncementsRefreshing: announcementsLoading && announcementsLoaded,
    creatingAnnouncement,
    togglingAnnouncementId,
    refreshAnnouncements,
    createAnnouncement,
    toggleAnnouncementActive,
  };
}
