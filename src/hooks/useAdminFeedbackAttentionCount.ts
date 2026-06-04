'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { adminClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { useNotificationStore } from '@/stores/useNotificationStore';

const POLL_MS = 60_000;

export function useAdminFeedbackAttentionCount(enabled: boolean) {
  const { addNotification } = useNotificationStore();
  const [count, setCount] = useState(0);
  const prevCountRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setCount(0);
      return;
    }
    const res = await adminClient.feedbackAttentionCount();
    if (res && res[0] === StatusCodes.Http200) {
      const next = res[1].count;
      if (prevCountRef.current !== null && next > prevCountRef.current) {
        addNotification(
          next === 1
            ? 'Új felhasználói bejelentés érkezett.'
            : `${next} bejelentés vár kezelésre.`,
          'info',
        );
      }
      prevCountRef.current = next;
      setCount(next);
    }
  }, [enabled, addNotification]);

  useEffect(() => {
    void refresh();
    if (!enabled) return;
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled, refresh]);

  return { count, refresh };
}
