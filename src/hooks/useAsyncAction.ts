'use client';

import { useCallback, useState } from 'react';

/** Egy async művelet — loading állapot gombokhoz / visszajelzéshez. */
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

/** Több párhuzamos művelet (pl. soronkénti státusz) — id alapú pending. */
export function usePendingIds() {
  const [ids, setIds] = useState<Set<number>>(() => new Set());

  const wrap = useCallback(async (id: number, fn: () => Promise<void>) => {
    setIds((prev) => new Set(prev).add(id));
    try {
      await fn();
    } finally {
      setIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const isPending = useCallback((id: number) => ids.has(id), [ids]);

  return { wrap, isPending, hasAny: ids.size > 0 };
}
