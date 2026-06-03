'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { useNotificationStore } from '@/stores/useNotificationStore';

type WebhookRow = {
  id: number;
  url: string;
  events: string[];
  is_active: boolean;
};

export function useAdminWebhooksPageData() {
  const { addNotification } = useNotificationStore();
  const [rows, setRows] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminClient.listWebhooks();
      if (res && res[0] === StatusCodes.Http200) {
        setRows((res[1] as { data: WebhookRow[] }).data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createWebhook = useCallback(
    async (url: string) => {
      const res = await adminClient.createWebhook({ url, events: ['order.updated', 'transaction.paid'] });
      if (!res || res[0] !== StatusCodes.Http201) {
        addNotification('A webhook létrehozása nem sikerült.', 'error');
        return;
      }
      addNotification('Webhook létrehozva.', 'success');
      await refresh();
    },
    [addNotification, refresh],
  );

  const removeWebhook = useCallback(
    async (id: number) => {
      await adminClient.deleteWebhook(id);
      addNotification('Webhook törölve.', 'success');
      await refresh();
    },
    [addNotification, refresh],
  );

  return { rows, loading, createWebhook, removeWebhook, refresh };
}
