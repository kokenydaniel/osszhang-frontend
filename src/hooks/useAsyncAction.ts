'use client';

import { useCallback, useState } from 'react';

export function useAsyncAction() {
  const [pending, setPending] = useState(false);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setPending(true);
    try {
      return await fn();
    } finally {
      setPending(false);
    }
  }, []);

  return { pending, run };
}

export function usePendingIds() {
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  const wrap = useCallback(async (id: number | string, fn: () => Promise<void>) => {
    const key = String(id);
    setIds((prev) => new Set(prev).add(key));
    try {
      await fn();
    } finally {
      setIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, []);

  const isPending = useCallback((id: number | string) => ids.has(String(id)), [ids]);

  return { wrap, isPending, hasAny: ids.size > 0 };
}
