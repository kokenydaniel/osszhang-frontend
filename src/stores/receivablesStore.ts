'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { receivablesClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { LoadableStatus } from '@/utils/loadable-status';
import type { ReceivableContact, ReceivablesSummary } from '@/types/receivables';

type ReceivablesState = {
  status: LoadableStatus;
  contacts: ReceivableContact[];
  summary: ReceivablesSummary;
  fetch: (force?: boolean) => Promise<void>;
  setFromIndex: (contacts: ReceivableContact[], summary: ReceivablesSummary) => void;
  upsertContact: (contact: ReceivableContact) => void;
  removeContact: (id: number) => void;
  reset: () => void;
};

const emptySummary: ReceivablesSummary = {
  totalLent: 0,
  totalRepaid: 0,
  totalOutstanding: 0,
  openContactCount: 0,
  contactCount: 0,
};

const initial = {
  status: LoadableStatus.Unloaded,
  contacts: [] as ReceivableContact[],
  summary: emptySummary,
};

export const receivablesStore = create<ReceivablesState>()(
  devtools(
    (set, get) => ({
      ...initial,

      fetch: async (force = false) => {
        if (!force && get().status === LoadableStatus.Loaded) return;

        set({ status: LoadableStatus.Loading });
        try {
          const res = await receivablesClient.index();
          if (!res || res[0] !== StatusCodes.Http200) {
            set({ ...initial, status: LoadableStatus.Error });
            return;
          }
          set({
            contacts: res[1].contacts,
            summary: res[1].summary,
            status: LoadableStatus.Loaded,
          });
        } catch {
          set({ ...initial, status: LoadableStatus.Error });
        }
      },

      setFromIndex: (contacts, summary) =>
        set({ contacts, summary, status: LoadableStatus.Loaded }),

      upsertContact: (contact) =>
        set((state) => {
          const exists = state.contacts.some((c) => c.id === contact.id);
          const contacts = exists
            ? state.contacts.map((c) => (c.id === contact.id ? contact : c))
            : [...state.contacts, contact];
          const totalLent = contacts.reduce((s, c) => s + c.totalLent, 0);
          const totalRepaid = contacts.reduce((s, c) => s + c.totalRepaid, 0);
          const totalOutstanding = Math.max(0, totalLent - totalRepaid);
          const openContactCount = contacts.filter((c) => !c.isSettled && c.outstanding > 0.005).length;
          return {
            contacts,
            summary: {
              totalLent,
              totalRepaid,
              totalOutstanding,
              openContactCount,
              contactCount: contacts.length,
            },
          };
        }),

      removeContact: (id) =>
        set((state) => {
          const contacts = state.contacts.filter((c) => c.id !== id);
          const totalLent = contacts.reduce((s, c) => s + c.totalLent, 0);
          const totalRepaid = contacts.reduce((s, c) => s + c.totalRepaid, 0);
          const totalOutstanding = Math.max(0, totalLent - totalRepaid);
          const openContactCount = contacts.filter((c) => !c.isSettled && c.outstanding > 0.005).length;
          return {
            contacts,
            summary: {
              totalLent,
              totalRepaid,
              totalOutstanding,
              openContactCount,
              contactCount: contacts.length,
            },
          };
        }),

      reset: () => set(initial),
    }),
    { name: 'receivables' },
  ),
);

export const useReceivablesStore = receivablesStore;
