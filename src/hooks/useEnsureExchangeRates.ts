'use client';

import { useEffect } from 'react';
import { useExchangeRatesStore } from '@/stores/useExchangeRatesStore';
import { fetchExchangeRates } from '@/utils/exchange-rates';

const REFRESH_MS = 30 * 60 * 1000;

export function useEnsureExchangeRates(enabled = true) {
  const setRates = useExchangeRatesStore((s) => s.setRates);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const load = async () => {
      const rates = await fetchExchangeRates();
      if (!cancelled) setRates(rates);
    };

    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [enabled, setRates]);
}
