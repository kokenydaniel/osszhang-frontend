'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminStore } from '@/stores/useAdminStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { adminClient, getApiErrorMessage } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { isAbortError } from '@/lib/api-client/abortError';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import type { ProductUpdatePayload } from '@/types/admin';

export function useAdminProductUpdatesPageData() {
  const {
    productUpdates,
    productUpdatesLoading,
    productUpdatesLoaded,
    setProductUpdates,
    patchProductUpdate,
    removeProductUpdate,
    prependProductUpdate,
    setProductUpdatesLoading,
    setProductUpdatesLoaded,
  } = useAdminStore();

  const { refreshSessionQuiet } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { pending: creating, run: runCreate } = useAsyncAction();
  const { pending: saving, run: runSave } = useAsyncAction();

  const refreshProductUpdates = useCallback(async () => {
    setProductUpdatesLoading(true);
    try {
      const res = await adminClient.listProductUpdates({ silent: true });
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      setProductUpdates(res[1].data ?? []);
      setProductUpdatesLoaded(true);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('[useAdminProductUpdatesPageData] list failed', error);
        addNotification('Az újdonságok betöltése nem sikerült.', 'error');
      }
    } finally {
      setProductUpdatesLoading(false);
    }
  }, [addNotification, setProductUpdates, setProductUpdatesLoaded, setProductUpdatesLoading]);

  useEffect(() => {
    if (productUpdatesLoaded || productUpdatesLoading) return;
    void refreshProductUpdates();
  }, [productUpdatesLoaded, productUpdatesLoading, refreshProductUpdates]);

  const createProductUpdate = useCallback(
    async (payload: ProductUpdatePayload): Promise<boolean> => {
      let success = false;
      await runCreate(async () => {
        try {
          const res = await adminClient.createProductUpdate(payload);
          if (!res || (res[0] !== StatusCodes.Http200 && res[0] !== StatusCodes.Http201)) {
            throw new Error('API Error');
          }
          prependProductUpdate(res[1].data);
          addNotification(
            res[1].data.is_active ? 'Újdonság közzétéve.' : 'Újdonság létrehozva.',
            'success',
          );
          if (res[1].data.is_active) await refreshSessionQuiet();
          success = true;
        } catch (error) {
          addNotification(getApiErrorMessage(error, 'Az újdonság létrehozása nem sikerült.'), 'error');
        }
      });
      return success;
    },
    [addNotification, prependProductUpdate, refreshSessionQuiet, runCreate],
  );

  const updateProductUpdate = useCallback(
    async (id: number, payload: ProductUpdatePayload): Promise<boolean> => {
      let success = false;
      await runSave(async () => {
        try {
          const res = await adminClient.updateProductUpdate(id, payload);
          if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
          patchProductUpdate(res[1].data);
          addNotification('Újdonság mentve.', 'success');
          if (res[1].data.is_active) await refreshSessionQuiet();
          success = true;
        } catch (error) {
          addNotification(getApiErrorMessage(error, 'Az újdonság mentése nem sikerült.'), 'error');
        }
      });
      return success;
    },
    [addNotification, patchProductUpdate, refreshSessionQuiet, runSave],
  );

  const toggleProductUpdateActive = useCallback(
    async (id: number) => {
      setTogglingId(id);
      try {
        const res = await adminClient.toggleProductUpdateActive(id);
        if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
        patchProductUpdate(res[1].data);
        addNotification(
          res[1].data.is_active ? 'Újdonság aktiválva.' : 'Újdonság kikapcsolva.',
          'success',
        );
        await refreshSessionQuiet();
      } catch (error) {
        addNotification(getApiErrorMessage(error, 'Az állapot mentése nem sikerült.'), 'error');
      } finally {
        setTogglingId(null);
      }
    },
    [addNotification, patchProductUpdate, refreshSessionQuiet],
  );

  const deleteProductUpdate = useCallback(
    async (id: number): Promise<boolean> => {
      setDeletingId(id);
      try {
        const res = await adminClient.deleteProductUpdate(id);
        if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
        removeProductUpdate(id);
        addNotification('Újdonság törölve.', 'success');
        await refreshSessionQuiet();
        return true;
      } catch (error) {
        addNotification(getApiErrorMessage(error, 'Az újdonság törlése nem sikerült.'), 'error');
        return false;
      } finally {
        setDeletingId(null);
      }
    },
    [addNotification, refreshSessionQuiet, removeProductUpdate],
  );

  return {
    productUpdates,
    isLoading: productUpdatesLoading && !productUpdatesLoaded,
    isRefreshing: productUpdatesLoading && productUpdatesLoaded,
    creating,
    saving,
    togglingId,
    deletingId,
    refreshProductUpdates,
    createProductUpdate,
    updateProductUpdate,
    toggleProductUpdateActive,
    deleteProductUpdate,
  };
}
