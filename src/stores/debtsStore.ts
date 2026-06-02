'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { debtsClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { LoadableStatus } from '@/utils/loadable-status';
import type { Debt, AiDebtPlan } from '@/types';

interface DebtsState {
  status: LoadableStatus;
  debts: Debt[];
  aiDebtPlan: AiDebtPlan | null;
  loadedWalletId: number | null;

  fetch: (walletId: number | null, force?: boolean) => Promise<void>;
  setDebts: (debts: Debt[], walletId: number) => void;
  setAiDebtPlan: (plan: AiDebtPlan | null) => void;
  patchDebt: (id: number, updated: Debt) => void;
  appendDebt: (debt: Debt) => void;
  removeDebt: (id: number) => void;
  reset: () => void;
}

const initial = {
  status: LoadableStatus.Unloaded,
  debts: [] as Debt[],
  aiDebtPlan: null as AiDebtPlan | null,
  loadedWalletId: null as number | null,
};

export const debtsStore = create<DebtsState>()(
  devtools(
    (set, get) => ({
      ...initial,

      fetch: async (walletId, force = false) => {
        if (!walletId) return;
        if (!force && get().loadedWalletId === walletId && get().status === LoadableStatus.Loaded) {
          return;
        }

        set({ status: LoadableStatus.Loading, loadedWalletId: null });
        try {
          const res = await debtsClient.getAll(walletId, { silent: true });
          if (!res || res[0] !== StatusCodes.Http200) {
            set({ ...initial, status: LoadableStatus.Error });
            return;
          }
          set({
            debts: res[1] ?? [],
            aiDebtPlan: null,
            loadedWalletId: walletId,
            status: LoadableStatus.Loaded,
          });
        } catch {
          set({ ...initial, status: LoadableStatus.Error });
        }
      },

      setDebts: (debts, walletId) =>
        set({
          debts,
          loadedWalletId: walletId,
          status: LoadableStatus.Loaded,
        }),

      setAiDebtPlan: (aiDebtPlan) => set({ aiDebtPlan }),

      patchDebt: (id, updated) =>
        set((state) => ({
          debts: state.debts.map((debt) => (debt.id === id ? updated : debt)),
        })),

      appendDebt: (debt) => set((state) => ({ debts: [...state.debts, debt] })),

      removeDebt: (id) => set((state) => ({ debts: state.debts.filter((d) => d.id !== id) })),

      reset: () => set(initial),
    }),
    { name: 'debts' },
  ),
);

export const useDebtsStore = debtsStore;
