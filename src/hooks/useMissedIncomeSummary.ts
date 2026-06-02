'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { budgetClient } from '@/lib/api-client';
import {
  budgetIncomeCalculations,
  type MissedIncomeSummary,
} from '@/calculations/budget-income';
import { StatusCodes } from '@/types/api';
import type { CashTransaction } from '@/types';

export function useMissedIncomeSummary(params: {
  walletId: number | null;
  selectedYear: number;
  throughMonth: number;
  enabled?: boolean;
  missedIncomeEnabled?: boolean;
  graceDays?: number;
}) {
  const { walletId, selectedYear, throughMonth, enabled = true, missedIncomeEnabled, graceDays } = params;
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!walletId) return;
    setLoading(true);
    try {
      const res = await budgetClient.getAll(walletId, { silent: true });
      if (!res || res[0] !== StatusCodes.Http200) throw new Error('API Error');
      setTransactions(res[1].transactions ?? []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [walletId]);

  useEffect(() => {
    if (!enabled || !walletId) {
      setTransactions([]);
      return;
    }
    void refresh();
  }, [enabled, walletId, selectedYear, refresh]);

  const summary = useMemo((): MissedIncomeSummary | null => {
    if (!enabled || !walletId) return null;
    return budgetIncomeCalculations.computeMissedIncomeSummary({
      transactions,
      selectedYear,
      throughMonth,
      missedIncomeEnabled,
      graceDays,
    });
  }, [enabled, walletId, transactions, selectedYear, throughMonth, missedIncomeEnabled, graceDays]);

  return { summary, loading, refresh };
}
