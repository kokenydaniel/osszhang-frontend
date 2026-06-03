'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { rentalClient } from '@/lib/api-client';
import { StatusCodes } from '@/types/api';
import { LoadableStatus } from '@/utils/loadable-status';
import type {
  RentalContractEndReminder,
  RentalExpense,
  RentalIncomeEntry,
  RentalOverdueRent,
  RentalProperty,
  RentalSummary,
} from '@/types/rental';

const emptySummary = (): RentalSummary => ({
  expectedRent: 0,
  expectedCommonCost: 0,
  expectedGross: 0,
  commonCostTotal: 0,
  expectedNet: 0,
  ownerExpenses: 0,
  received: 0,
  outstanding: 0,
  propertyCount: 0,
  paidCount: 0,
  recordedCount: 0,
  unpaidCount: 0,
});

interface RentalState {
  status: LoadableStatus;
  loadedPeriod: string | null;
  properties: RentalProperty[];
  incomeEntries: RentalIncomeEntry[];
  expenses: RentalExpense[];
  summary: RentalSummary;
  upcomingContractEnds: RentalContractEndReminder[];
  overdueRents: RentalOverdueRent[];

  fetch: (year: number, month: number, force?: boolean) => Promise<void>;
  upsertProperty: (property: RentalProperty) => void;
  removeProperty: (id: number) => void;
  upsertIncome: (entry: RentalIncomeEntry) => void;
  removeIncome: (id: number) => void;
  upsertExpense: (expense: RentalExpense) => void;
  removeExpense: (id: number) => void;
  setFromIndex: (data: {
    properties: RentalProperty[];
    incomeEntries: RentalIncomeEntry[];
    expenses: RentalExpense[];
    summary: RentalSummary;
    upcomingContractEnds: RentalContractEndReminder[];
    overdueRents: RentalOverdueRent[];
    periodKey: string;
  }) => void;
  reset: () => void;
}

const initial = {
  status: LoadableStatus.Unloaded,
  loadedPeriod: null as string | null,
  properties: [] as RentalProperty[],
  incomeEntries: [] as RentalIncomeEntry[],
  expenses: [] as RentalExpense[],
  summary: emptySummary(),
  upcomingContractEnds: [] as RentalContractEndReminder[],
  overdueRents: [] as RentalOverdueRent[],
};

function periodKey(year: number, month: number): string {
  return `${year}-${month}`;
}

export const rentalStore = create<RentalState>()(
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
          const res = await rentalClient.getIndex(year, month, { silent: true });
          if (!res || res[0] !== StatusCodes.Http200) {
            if (!isRefresh) set({ ...initial, status: LoadableStatus.Error });
            return;
          }
          const data = res[1];
          set({
            properties: data?.properties ?? [],
            incomeEntries: data?.incomeEntries ?? [],
            expenses: data?.expenses ?? [],
            summary: data?.summary ?? emptySummary(),
            upcomingContractEnds: data?.upcomingContractEnds ?? [],
            overdueRents: data?.overdueRents ?? [],
            loadedPeriod: key,
            status: LoadableStatus.Loaded,
          });
        } catch {
          if (!isRefresh) set({ ...initial, status: LoadableStatus.Error });
        }
      },

      upsertProperty: (property) =>
        set((state) => {
          const exists = state.properties.some((p) => p.id === property.id);
          const properties = exists
            ? state.properties.map((p) => (p.id === property.id ? property : p))
            : [...state.properties, property].sort((a, b) => a.name.localeCompare(b.name, 'hu'));
          return { properties };
        }),

      removeProperty: (id) =>
        set((state) => ({
          properties: state.properties.filter((p) => p.id !== id),
          incomeEntries: state.incomeEntries.filter((e) => e.rentalPropertyId !== id),
          expenses: state.expenses.filter((e) => e.rentalPropertyId !== id),
        })),

      upsertIncome: (entry) =>
        set((state) => {
          const exists = state.incomeEntries.some((e) => e.id === entry.id);
          const incomeEntries = exists
            ? state.incomeEntries.map((e) => (e.id === entry.id ? entry : e))
            : [entry, ...state.incomeEntries];
          return { incomeEntries };
        }),

      removeIncome: (id) =>
        set((state) => ({
          incomeEntries: state.incomeEntries.filter((e) => e.id !== id),
        })),

      upsertExpense: (expense) =>
        set((state) => {
          const exists = state.expenses.some((e) => e.id === expense.id);
          const expenses = exists
            ? state.expenses.map((e) => (e.id === expense.id ? expense : e))
            : [expense, ...state.expenses].sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
          return { expenses };
        }),

      removeExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),

      setFromIndex: (data) =>
        set({
          properties: data.properties,
          incomeEntries: data.incomeEntries,
          expenses: data.expenses,
          summary: data.summary,
          upcomingContractEnds: data.upcomingContractEnds,
          overdueRents: data.overdueRents,
          loadedPeriod: data.periodKey,
          status: LoadableStatus.Loaded,
        }),

      reset: () => set(initial),
    }),
    { name: 'rental' },
  ),
);

export const useRentalStore = rentalStore;
