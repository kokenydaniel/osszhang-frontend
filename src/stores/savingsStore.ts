'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { investmentsClient, savingsClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { LoadableStatus } from '@/utils/loadable-status';
import type { SavingsAccount, Investment } from '@/types';
import { savingsCalculations } from '@/calculations/savings';

interface SavingsState {
  status: LoadableStatus;
  savings: SavingsAccount[];
  investments: Investment[];
  loadedWalletId: number | null;

  fetch: (walletId: number | null, force?: boolean) => Promise<void>;
  setSavings: (data: SavingsAccount[], walletId: number) => void;
  setInvestments: (data: Investment[]) => void;
  patchSavingsItem: (id: number, updated: SavingsAccount) => void;
  appendSavingsItem: (item: SavingsAccount) => void;
  removeSavingsItem: (id: number) => void;
  patchInvestment: (id: number, updated: Investment) => void;
  appendInvestment: (item: Investment) => void;
  removeInvestment: (id: number) => void;
  reset: () => void;
}

const initial = {
  status: LoadableStatus.Unloaded,
  savings: [] as SavingsAccount[],
  investments: [] as Investment[],
  loadedWalletId: null as number | null,
};

export const savingsStore = create<SavingsState>()(
  devtools(
    (set, get) => ({
      ...initial,

      fetch: async (walletId, force = false) => {
        if (!walletId) return;
        if (!force && get().loadedWalletId === walletId && get().status === LoadableStatus.Loaded) {
          return;
        }

        set({ status: LoadableStatus.Loading });
        try {
          const [accountsResult, investmentsResult] = await Promise.allSettled([
            savingsClient.getAll(walletId, { silent: true }),
            investmentsClient.getAll({ silent: true }),
          ]);

          if (accountsResult.status === 'rejected') {
            set({ ...initial, status: LoadableStatus.Error });
            return;
          }

          const accountsRes = accountsResult.value;
          if (!accountsRes || accountsRes[0] !== StatusCodes.Http200) {
            set({ ...initial, status: LoadableStatus.Error });
            return;
          }

          const investments =
            investmentsResult.status === 'fulfilled' && investmentsResult.value
              ? (investmentsResult.value[1] ?? []).map(savingsCalculations.normalizeInvestment)
              : [];

          set({
            savings: accountsRes[1] ?? [],
            investments,
            loadedWalletId: walletId,
            status: LoadableStatus.Loaded,
          });
        } catch {
          set({ ...initial, status: LoadableStatus.Error });
        }
      },

      setSavings: (data, walletId) =>
        set({ savings: data, loadedWalletId: walletId, status: LoadableStatus.Loaded }),

      setInvestments: (data) => set({ investments: data.map(savingsCalculations.normalizeInvestment) }),

      patchSavingsItem: (id, updated) =>
        set((state) => ({
          savings: state.savings.map((s) => (s.id === id ? updated : s)),
        })),

      appendSavingsItem: (item) => set((state) => ({ savings: [...state.savings, item] })),

      removeSavingsItem: (id) => set((state) => ({ savings: state.savings.filter((s) => s.id !== id) })),

      patchInvestment: (id, updated) =>
        set((state) => ({
          investments: state.investments.map((i) =>
            i.id === id ? savingsCalculations.normalizeInvestment(updated) : i,
          ),
        })),

      appendInvestment: (item) =>
        set((state) => ({ investments: [...state.investments, savingsCalculations.normalizeInvestment(item)] })),

      removeInvestment: (id) =>
        set((state) => ({ investments: state.investments.filter((i) => i.id !== id) })),

      reset: () => set(initial),
    }),
    { name: 'savings' },
  ),
);

export const useSavingsStore = savingsStore;
