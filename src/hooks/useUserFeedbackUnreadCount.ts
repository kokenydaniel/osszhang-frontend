'use client';

import { useCallback, useEffect, useState } from 'react';
import { feedbackClient } from '@/lib/api-client';

const POLL_MS = 90_000;

export function useUserFeedbackUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setCount(0);
      return;
    }
    const res = await feedbackClient.listMine();
    if (res) setCount(res.unreadCount);
  }, [enabled]);

  useEffect(() => {
    void refresh();
    if (!enabled) return;
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled, refresh]);

  return { count, refresh };
}
