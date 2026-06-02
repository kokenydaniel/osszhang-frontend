'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { utilitiesClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { LoadableStatus } from '@/utils/loadable-status';
import type { AiUtilityAnomalies } from '@/types';
import type { UtilityBill, UtilitySettlement } from '@/types';

interface UtilitiesState {
  status: LoadableStatus;
  bills: UtilityBill[];
  settlements: UtilitySettlement[];
  aiUtilityAnomalies: AiUtilityAnomalies | null;

  fetch: (force?: boolean) => Promise<void>;
  setUtilities: (data: { bills: UtilityBill[]; settlements: UtilitySettlement[] }) => void;
  setAiUtilityAnomalies: (data: AiUtilityAnomalies | null) => void;
  patchBill: (id: number, updated: UtilityBill) => void;
  appendBill: (bill: UtilityBill) => void;
  removeBill: (id: number) => void;
  reset: () => void;
}

const initial = {
  status: LoadableStatus.Unloaded,
  bills: [] as UtilityBill[],
  settlements: [] as UtilitySettlement[],
  aiUtilityAnomalies: null as AiUtilityAnomalies | null,
};

export const utilitiesStore = create<UtilitiesState>()(
  devtools(
    (set, get) => ({
      ...initial,

      fetch: async (force = false) => {
        if (!force && get().status === LoadableStatus.Loaded) return;

        const keepVisible = force && get().status === LoadableStatus.Loaded;
        if (!keepVisible) {
          set({ status: LoadableStatus.Loading });
        }
        try {
          const res = await utilitiesClient.getAll({ silent: true });
          if (!res || res[0] !== StatusCodes.Http200) {
            set({ ...initial, status: LoadableStatus.Error });
            return;
          }
          set({
            bills: res[1].bills ?? [],
            settlements: res[1].settlements ?? [],
            status: LoadableStatus.Loaded,
          });
        } catch {
          set({ ...initial, status: LoadableStatus.Error });
        }
      },

      setUtilities: ({ bills, settlements }) =>
        set({ bills, settlements, status: LoadableStatus.Loaded }),

      setAiUtilityAnomalies: (aiUtilityAnomalies) => set({ aiUtilityAnomalies }),

      patchBill: (id, updated) =>
        set((state) => ({
          bills: state.bills.map((bill) => (bill.id === id ? updated : bill)),
        })),

      appendBill: (bill) => set((state) => ({ bills: [...state.bills, bill] })),

      removeBill: (id) => set((state) => ({ bills: state.bills.filter((b) => b.id !== id) })),

      reset: () => set(initial),
    }),
    { name: 'utilities' },
  ),
);

export const useUtilitiesStore = utilitiesStore;
