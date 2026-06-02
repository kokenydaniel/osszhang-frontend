'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminStore } from '@/stores/useAdminStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { adminClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { isAbortError } from '@/lib/api-client/abortError';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import type { CreateSystemAnnouncementPayload } from '@/types/admin';

export function useAdminAnnouncementsPageData() {
  const {
    announcements,
    announcementsLoading,
    announcementsLoaded,
    setAnnouncements,
    applyAnnouncementToggle,
    patchAnnouncement,
    removeAnnouncement,
    prependAnnouncement,
    setAnnouncementsLoading,
    setAnnouncementsLoaded,
  } = useAdminStore();

  const { refreshSessionQuiet } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [togglingAnnouncementId, setTogglingAnnouncementId] = useState<number | null>(null);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<number | null>(null);
  const { pending: creatingAnnouncement, run: runCreateAnnouncement } = useAsyncAction();
  const { pending: savingAnnouncement, run: runSaveAnnouncement } = useAsyncAction();

  const refreshAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    try {
      const res = await adminClient.listAnnouncements({ silent: true });
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      setAnnouncements(res[1].data ?? []);
      setAnnouncementsLoaded(true);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('[useAdminAnnouncementsPageData] listAnnouncements failed', error);
        addNotification('A rendszerüzenetek betöltése nem sikerült.', 'error');
      }
    } finally {
      setAnnouncementsLoading(false);
    }
  }, [addNotification, setAnnouncements, setAnnouncementsLoaded, setAnnouncementsLoading]);

  useEffect(() => {
    if (announcementsLoaded || announcementsLoading) return;
    void refreshAnnouncements();
  }, [announcementsLoaded, announcementsLoading, refreshAnnouncements]);

  const createAnnouncement = useCallback(
    async (payload: CreateSystemAnnouncementPayload): Promise<boolean> => {
      let success = false;
      await runCreateAnnouncement(async () => {
        try {
          const res = await adminClient.createAnnouncement(payload);
          if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
            throw new Error('API Error');
          }
          prependAnnouncement(res[1].data);
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
        const res = await adminClient.toggleAnnouncementActive(id);
        if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
        const updated = res[1].data;
        applyAnnouncementToggle(updated);
        addNotification(
          updated.is_active ? 'Rendszerüzenet aktiválva.' : 'Rendszerüzenet kikapcsolva.',
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

  const updateAnnouncement = useCallback(
    async (id: number, payload: CreateSystemAnnouncementPayload): Promise<boolean> => {
      let success = false;
      await runSaveAnnouncement(async () => {
        try {
          const res = await adminClient.updateAnnouncement(id, payload);
          if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
          patchAnnouncement(res[1].data);
          addNotification('Rendszerüzenet frissítve.', 'success');
          if (res[1].data.is_active) await refreshSessionQuiet();
          success = true;
        } catch (error) {
          addNotification(
            getApiErrorMessage(error, 'A rendszerüzenet mentése nem sikerült.'),
            'error',
          );
        }
      });
      return success;
    },
    [addNotification, patchAnnouncement, refreshSessionQuiet, runSaveAnnouncement],
  );

  const deleteAnnouncement = useCallback(
    async (id: number): Promise<boolean> => {
      setDeletingAnnouncementId(id);
      try {
        const res = await adminClient.deleteAnnouncement(id);
        if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
        removeAnnouncement(id);
        addNotification('Rendszerüzenet törölve.', 'success');
        await refreshSessionQuiet();
        return true;
      } catch (error) {
        addNotification(
          getApiErrorMessage(error, 'A rendszerüzenet törlése nem sikerült.'),
          'error',
        );
        return false;
      } finally {
        setDeletingAnnouncementId(null);
      }
    },
    [addNotification, refreshSessionQuiet, removeAnnouncement],
  );

  return {
    announcements,
    isAnnouncementsLoading: announcementsLoading && !announcementsLoaded,
    isAnnouncementsRefreshing: announcementsLoading && announcementsLoaded,
    creatingAnnouncement,
    savingAnnouncement,
    togglingAnnouncementId,
    deletingAnnouncementId,
    refreshAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleAnnouncementActive,
  };
}
