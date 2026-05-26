'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildAiCfoCacheKeyFromPayload,
  buildAiCfoDataFingerprint,
  clearAiCfoAdviceCache,
  ensureAiCfoAdviceLoaded,
} from '@/lib/aiCfoLoader';
import { useDashboardStore } from '@/stores/useDashboardStore';
import type { AiCfoContextPayload } from '@/types';

export function useAiCfoWidget(context: AiCfoContextPayload | null, financialDataReady: boolean) {
  const aiCfoAdvice = useDashboardStore((s) => s.aiCfoAdvice);
  const aiCfoCacheKey = useDashboardStore((s) => s.aiCfoCacheKey);

  const contextRef = useRef(context);
  contextRef.current = context;

  const dataFingerprint =
    financialDataReady && context ? buildAiCfoDataFingerprint(context) : null;

  const cacheKey =
    financialDataReady && context ? buildAiCfoCacheKeyFromPayload(context) : null;

  const cachedBrief = cacheKey && aiCfoCacheKey === cacheKey ? aiCfoAdvice : null;

  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waitingForData = !financialDataReady;

  useEffect(() => {
    if (!financialDataReady || !cacheKey || !dataFingerprint) {
      setIsFetching(false);
      setError(null);
      return;
    }

    if (cachedBrief) {
      setIsFetching(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsFetching(true);
    setError(null);

    const payload = contextRef.current;
    if (!payload) {
      setIsFetching(false);
      setError('Válassz pénztárcát az AI CFO betöltéséhez.');
      return;
    }

    void ensureAiCfoAdviceLoaded(payload, { silent: true })
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setError('Az AI CFO jelenleg nem érhető el. Ellenőrizd az előfizetésedet, vagy próbáld újra később.');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Hiba történt az AI CFO betöltése közben.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsFetching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, cachedBrief, dataFingerprint, financialDataReady]);

  const reload = useCallback(() => {
    if (!contextRef.current) return;
    clearAiCfoAdviceCache();
    setError(null);
    setIsFetching(true);

    void ensureAiCfoAdviceLoaded(contextRef.current, { force: true, silent: true })
      .then((result) => {
        if (!result) {
          setError('Az AI CFO jelenleg nem érhető el. Ellenőrizd az előfizetésedet, vagy próbáld újra később.');
        }
      })
      .catch(() => {
        setError('Hiba történt az AI CFO betöltése közben.');
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, []);

  return {
    brief: cachedBrief,
    isLoading: waitingForData || isFetching,
    waitingForData,
    error,
    reload,
  };
}

export type AiCfoWidgetState = ReturnType<typeof useAiCfoWidget>;
