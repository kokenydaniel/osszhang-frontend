'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { pocketMoneyClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { LoadableStatus } from '@/utils/loadable-status';
import type { PocketMoneyEntry, PocketMoneyMemberSummary } from '@/types/pocket-money';

interface PocketMoneyState {
  status: LoadableStatus;
  entries: PocketMoneyEntry[];
  members: PocketMoneyMemberSummary[];
  loadedPeriod: string | null;

  fetch: (year: number, month: number, force?: boolean) => Promise<void>;
  refreshSilent: (year: number, month: number) => Promise<void>;
  upsertEntry: (entry: PocketMoneyEntry) => void;
  removeEntry: (id: number) => void;
  setData: (entries: PocketMoneyEntry[], members: PocketMoneyMemberSummary[], periodKey: string) => void;
  reset: () => void;
}

const initial = {
  status: LoadableStatus.Unloaded,
  entries: [] as PocketMoneyEntry[],
  members: [] as PocketMoneyMemberSummary[],
  loadedPeriod: null as string | null,
};

function periodKey(year: number, month: number): string {
  return `${year}-${month}`;
}

export const pocketMoneyStore = create<PocketMoneyState>()(
  devtools(
    (set, get) => ({
      ...initial,

      fetch: async (year, month, force = false) => {
        const key = periodKey(year, month);
        const alreadyLoaded = get().loadedPeriod === key && get().status === LoadableStatus.Loaded;
        if (!force && alreadyLoaded) return;

        const isRefresh = get().status === LoadableStatus.Loaded;
        if (!isRefresh) {
          set({ status: LoadableStatus.Loading, loadedPeriod: null });
        }

        try {
          const res = await pocketMoneyClient.getIndex(year, month, { silent: true });
          if (!res || res[0] !== StatusCodes.Http200) {
            if (!isRefresh) set({ ...initial, status: LoadableStatus.Error });
            return;
          }
          const data = res[1];
          set({
            entries: data?.entries ?? [],
            members: data?.members ?? [],
            loadedPeriod: key,
            status: LoadableStatus.Loaded,
          });
        } catch {
          if (!isRefresh) set({ ...initial, status: LoadableStatus.Error });
        }
      },

      refreshSilent: async (year, month) => {
        const key = periodKey(year, month);
        try {
          const res = await pocketMoneyClient.getIndex(year, month, { silent: true });
          if (!res || res[0] !== StatusCodes.Http200) return;
          const data = res[1];
          set({
            entries: data?.entries ?? [],
            members: data?.members ?? [],
            loadedPeriod: key,
            status: LoadableStatus.Loaded,
          });
        } catch {
          /* keep current list on background sync failure */
        }
      },

      upsertEntry: (entry) =>
        set((state) => {
          const exists = state.entries.some((e) => e.id === entry.id);
          const entries = exists
            ? state.entries.map((e) => (e.id === entry.id ? entry : e))
            : [entry, ...state.entries];
          return { entries };
        }),

      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      setData: (entries, members, key) =>
        set({
          entries,
          members,
          loadedPeriod: key,
          status: LoadableStatus.Loaded,
        }),

      reset: () => set(initial),
    }),
    { name: 'pocket-money' },
  ),
);

export const usePocketMoneyStore = pocketMoneyStore;
