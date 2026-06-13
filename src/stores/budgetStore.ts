'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { budgetClient } from '@/lib/api-client';
import { ensureBudgetAiInsightsLoaded } from '@/helpers/budget-ai-loader';
import { budgetPeriodKey } from '@/helpers/store-ready';
import { StatusCodes } from '@/types/api';
import { LoadableStatus } from '@/utils/loadable-status';
import type { AiCashflowForecast, AiOverspendAnalysis, CashTransaction } from '@/types';

interface BudgetState {
  status: LoadableStatus;
  transactions: CashTransaction[];
  goalRows: CashTransaction[];
  aiOverspend: AiOverspendAnalysis | null;
  aiCashflowForecast: AiCashflowForecast | null;
  loadedKey: string | null;

  fetch: (walletId: number | null, year: number, month: number, force?: boolean) => Promise<void>;
  fetchAiInsights: (
    walletId: number | null,
    year: number,
    month: number,
    canUseAi: boolean,
    options?: { force?: boolean },
  ) => Promise<void>;
  setTransactions: (transactions: CashTransaction[]) => void;
  setGoalRows: (goalRows: CashTransaction[]) => void;
  patchTransaction: (id: number, updated: CashTransaction) => void;
  reset: () => void;
}

const initial = {
  status: LoadableStatus.Unloaded,
  transactions: [] as CashTransaction[],
  goalRows: [] as CashTransaction[],
  aiOverspend: null as AiOverspendAnalysis | null,
  aiCashflowForecast: null as AiCashflowForecast | null,
  loadedKey: null as string | null,
};

export const budgetStore = create<BudgetState>()(
  devtools(
    (set, get) => ({
      ...initial,

      fetch: async (walletId, year, month, force = false) => {
        if (!walletId) return;
        const key = budgetPeriodKey(walletId, year, month);
        if (!force && get().loadedKey === key && get().status === LoadableStatus.Loaded) return;

        set({ status: LoadableStatus.Loading });
        try {
          const res = await budgetClient.getForPeriod(walletId, month, year);
          if (!res || res[0] !== StatusCodes.Http200) {
            set({ ...initial, status: LoadableStatus.Error });
            return;
          }
          set({
            transactions: res[1].transactions,
            goalRows: res[1].goalRows,
            loadedKey: key,
            status: LoadableStatus.Loaded,
          });
        } catch {
          set({ ...initial, status: LoadableStatus.Error });
        }
      },

      fetchAiInsights: async (walletId, year, month, canUseAi, options?: { force?: boolean }) => {
        if (!walletId || !canUseAi) {
          set({ aiOverspend: null, aiCashflowForecast: null });
          return;
        }
        const result = await ensureBudgetAiInsightsLoaded(walletId, year, month, {
          silent: true,
          force: options?.force,
        });
        if (!result) {
          set({ aiOverspend: null, aiCashflowForecast: null });
          return;
        }
        set({ aiOverspend: result.overspend, aiCashflowForecast: result.forecast });
      },

      setTransactions: (transactions) => set({ transactions }),
      setGoalRows: (goalRows) => set({ goalRows }),
      patchTransaction: (id, updated) =>
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
        })),
      reset: () => set(initial),
    }),
    { name: 'budget' },
  ),
);

export const useBudgetStore = budgetStore;
