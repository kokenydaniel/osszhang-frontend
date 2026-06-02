'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { businessClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { LoadableStatus } from '@/utils/loadable-status';
import type { BusinessOrder } from '@/types/business';

interface BusinessState {
  status: LoadableStatus;
  orders: BusinessOrder[];
  loadedHouseholdId: number | null;

  fetch: (householdId: number | undefined, force?: boolean) => Promise<void>;
  setOrders: (orders: BusinessOrder[], householdId?: number | null) => void;
  appendOrder: (order: BusinessOrder) => void;
  patchOrder: (id: number, updated: BusinessOrder) => void;
  removeOrder: (id: number) => void;
  reset: () => void;
}

const initial = {
  status: LoadableStatus.Unloaded,
  orders: [] as BusinessOrder[],
  loadedHouseholdId: null as number | null,
};

export const businessStore = create<BusinessState>()(
  devtools(
    (set, get) => ({
      ...initial,

      fetch: async (householdId, force = false) => {
        if (!householdId) return;
        if (
          !force &&
          get().loadedHouseholdId === householdId &&
          get().status === LoadableStatus.Loaded
        ) {
          return;
        }

        set({ status: LoadableStatus.Loading });
        try {
          const res = await businessClient.getAll({ silent: true });
          if (!res || res[0] !== StatusCodes.Http200) {
            set({ ...initial, status: LoadableStatus.Error });
            return;
          }
          set({
            orders: (res[1] ?? []) as BusinessOrder[],
            loadedHouseholdId: householdId,
            status: LoadableStatus.Loaded,
          });
        } catch {
          set({ ...initial, status: LoadableStatus.Error });
        }
      },

      setOrders: (orders, householdId = null) =>
        set({
          orders,
          loadedHouseholdId: householdId,
          status: LoadableStatus.Loaded,
        }),

      appendOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),

      patchOrder: (id, updated) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? updated : o)),
        })),

      removeOrder: (id) => set((state) => ({ orders: state.orders.filter((o) => o.id !== id) })),

      reset: () => set(initial),
    }),
    { name: 'business' },
  ),
);

export const useBusinessStore = businessStore;
