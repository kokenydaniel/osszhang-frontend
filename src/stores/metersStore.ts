'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { metersClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { LoadableStatus } from '@/utils/loadable-status';
import type { Meter } from '@/types';

interface MetersState {
  status: LoadableStatus;
  meters: Meter[];
  loadedHouseholdId: number | null;

  fetch: (householdId: number | undefined, force?: boolean) => Promise<void>;
  setMeters: (meters: Meter[], householdId: number) => void;
  patchMeter: (id: number, updated: Meter) => void;
  appendMeter: (meter: Meter) => void;
  removeMeter: (id: number) => void;
  reset: () => void;
}

const initial = {
  status: LoadableStatus.Unloaded,
  meters: [] as Meter[],
  loadedHouseholdId: null as number | null,
};

export const metersStore = create<MetersState>()(
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
          const res = await metersClient.getAll({ silent: true });
          if (!res || res[0] !== StatusCodes.Http200) {
            set({ ...initial, status: LoadableStatus.Error });
            return;
          }
          set({
            meters: res[1] ?? [],
            loadedHouseholdId: householdId,
            status: LoadableStatus.Loaded,
          });
        } catch {
          set({ ...initial, status: LoadableStatus.Error });
        }
      },

      setMeters: (meters, householdId) =>
        set({ meters, loadedHouseholdId: householdId, status: LoadableStatus.Loaded }),

      patchMeter: (id, updated) =>
        set((state) => ({
          meters: state.meters.map((m) => (m.id === id ? updated : m)),
        })),

      appendMeter: (meter) => set((state) => ({ meters: [...state.meters, meter] })),

      removeMeter: (id) => set((state) => ({ meters: state.meters.filter((m) => m.id !== id) })),

      reset: () => set(initial),
    }),
    { name: 'meters' },
  ),
);

export const useMetersStore = metersStore;
