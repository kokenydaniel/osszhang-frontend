'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildAiCfoCacheKeyFromPayload,
  buildAiCfoDataFingerprint,
  clearAiCfoAdviceCache,
  ensureAiCfoAdviceLoaded,
} from '@/helpers/ai-cfo-loader';
import { useDashboardStore } from '@/stores/useDashboardStore';
import type { AiCfoContextPayload } from '@/types';

export function useAiCfoWidget(
  context: AiCfoContextPayload | null,
  financialDataReady: boolean,
  enabled = true,
) {
  const aiCfoAdvice = useDashboardStore((s) => s.aiCfoAdvice);
  const aiCfoCacheKey = useDashboardStore((s) => s.aiCfoCacheKey);

  const contextRef = useRef(context);
  contextRef.current = context;

  const dataFingerprint =
    enabled && financialDataReady && context ? buildAiCfoDataFingerprint(context) : null;

  const cacheKey =
    enabled && financialDataReady && context ? buildAiCfoCacheKeyFromPayload(context) : null;

  const cachedBrief = cacheKey && aiCfoCacheKey === cacheKey ? aiCfoAdvice : null;

  const [isFetching, setIsFetching] = useState(false);

  const waitingForData = enabled && !financialDataReady;

  useEffect(() => {
    if (!enabled || !financialDataReady || !cacheKey || !dataFingerprint) {
      setIsFetching(false);
      return;
    }

    if (cachedBrief) {
      setIsFetching(false);
      return;
    }

    const payload = contextRef.current;
    if (!payload) {
      setIsFetching(false);
      return;
    }

    let cancelled = false;
    setIsFetching(true);

    void ensureAiCfoAdviceLoaded(payload, { silent: true })
      .finally(() => {
        if (!cancelled) {
          setIsFetching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, cachedBrief, dataFingerprint, enabled, financialDataReady]);

  const reload = useCallback(() => {
    if (!enabled || !contextRef.current) return;
    clearAiCfoAdviceCache();
    setIsFetching(true);

    void ensureAiCfoAdviceLoaded(contextRef.current, { force: true, silent: true }).finally(() => {
      setIsFetching(false);
    });
  }, [enabled]);

  return {
    brief: cachedBrief,
    isLoading: waitingForData || isFetching,
    waitingForData,
    reload,
  };
}

export type AiCfoWidgetState = ReturnType<typeof useAiCfoWidget>;
