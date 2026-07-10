'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { businessClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';

export type MissingDocMonth = {
  year: number;
  month: number;
};


export function useBusinessDocumentCoverage(enabled: boolean) {
  const [missingMonths, setMissingMonths] = useState<MissingDocMonth[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const monthsToCheck = useMemo<MissingDocMonth[]>(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    const result: MissingDocMonth[] = [];

    let y = currentYear;
    let m = currentMonth - 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }

    for (let i = 0; i < 24; i++) {
      if (y < currentYear || (y === currentYear && m < 1)) break;

      result.push({ year: y, month: m });

      m -= 1;
      if (m === 0) {
        m = 12;
        y -= 1;
      }
    }

    return result;
  }, []);

  const checkCoverage = useCallback(async () => {
    if (!enabled || monthsToCheck.length === 0) return;
    setLoading(true);

    try {
      const results = await Promise.all(
        monthsToCheck.map(async ({ year, month }) => {
          const res = await businessClient.listDocuments(year, month);
          const count =
            res && res[0] === StatusCodes.Http200 ? (res[1]?.length ?? 0) : 0;
          return { year, month, count };
        }),
      );

      const missing = results
        .filter((r) => r.count === 0)
        .map(({ year, month }) => ({ year, month }))
        .sort((a, b) => a.year - b.year || a.month - b.month);

      setMissingMonths(missing);
    } finally {
      setLoading(false);
    }
  }, [enabled, monthsToCheck]);

  useEffect(() => {
    if (!enabled) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    void checkCoverage();
  }, [checkCoverage, enabled]);

  const updateMonthCoverage = useCallback(
    (year: number, month: number, hasDocs: boolean) => {
      setMissingMonths((prev) => {
        if (hasDocs) {
          return prev.filter((m) => !(m.year === year && m.month === month));
        } else {
          const isCheckable = monthsToCheck.some((m) => m.year === year && m.month === month);
          if (!isCheckable) return prev;
          if (prev.some((m) => m.year === year && m.month === month)) return prev;
          return [...prev, { year, month }].sort((a, b) => a.year - b.year || a.month - b.month);
        }
      });
    },
    [monthsToCheck],
  );

  return {
    missingMonths,
    coverageLoading: loading,
    recheckCoverage: checkCoverage,
    updateMonthCoverage,
  };
}
