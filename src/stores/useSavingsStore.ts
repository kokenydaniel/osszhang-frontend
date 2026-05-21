import { create } from 'zustand';
import { SavingsAccount, AiSavingsPlan, LedgerEntry, Investment } from '@/types';
import { savingsClient, investmentsClient, aiFinanceClient } from '@/api';

interface SavingsFetchOptions {
  silent?: boolean;
}

interface SavingsState {
  savings: SavingsAccount[];
  investments: Investment[];
  aiSavingsPlan: AiSavingsPlan | null;
  isLoading: boolean;

  fetchSavings: (options?: SavingsFetchOptions) => Promise<void>;
  addSavingsAccount: (s: Omit<SavingsAccount, 'id' | 'ledger'>) => Promise<void>;
  updateSavingsAccount: (id: number, s: Partial<Omit<SavingsAccount, 'id' | 'ledger'>>) => Promise<void>;
  deleteSavingsAccount: (id: number) => Promise<void>;
  
  addLedgerEntry: (savingsId: number, entry: Omit<LedgerEntry, 'id'>) => Promise<void>;
  updateLedgerEntry: (savingsId: number, entryId: number, entry: Partial<Omit<LedgerEntry, 'id'>>) => Promise<void>;
  deleteLedgerEntry: (savingsId: number, entryId: number) => Promise<void>;
  
  fetchInvestments: (options?: SavingsFetchOptions) => Promise<void>;
  addInvestment: (i: Omit<Investment, 'id'>) => Promise<void>;
  updateInvestment: (id: number, i: Partial<Omit<Investment, 'id'>>) => Promise<void>;
  deleteInvestment: (id: number) => Promise<void>;

  fetchAiSavingsPlan: (payload: {
    goals: Array<{ name: string; target_amount: number; target_date: string; priority?: number }>;
    constraints?: { min_buffer?: number };
  }) => Promise<void>;
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  savings: [],
  investments: [],
  aiSavingsPlan: null,
  isLoading: false,

  fetchSavings: async (options) => {
    set({ isLoading: true });
    try {
      const res = await savingsClient.getAll({ silent: options?.silent });
      set({ savings: res.data });
    } catch (e) {
      console.error('Failed to fetch savings', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addSavingsAccount: async (s) => {
    const res = await savingsClient.create(s);
    set({ savings: [...get().savings, res.data] });
  },

  updateSavingsAccount: async (id, s) => {
    const prev = get().savings;
    set({
      savings: prev.map((acc) => (acc.id === id ? { ...acc, ...s } : acc)),
    });
    try {
      const res = await savingsClient.update(id, s);
      set({ savings: get().savings.map((acc) => (acc.id === id ? res.data : acc)) });
    } catch (e) {
      set({ savings: prev });
      throw e;
    }
  },

  deleteSavingsAccount: async (id) => {
    await savingsClient.delete(id);
    set({ savings: get().savings.filter((s) => s.id !== id) });
  },

  addLedgerEntry: async (savingsId, entry) => {
    const res = await savingsClient.addEntry(savingsId, entry);
    set({
      savings: get().savings.map((s) =>
        s.id === savingsId ? res.data : s
      ),
    });
  },

  updateLedgerEntry: async (savingsId, entryId, entry) => {
    const res = await savingsClient.updateEntry(savingsId, entryId, entry);
    set({
      savings: get().savings.map((s) => (s.id === savingsId ? res.data : s)),
    });
  },

  deleteLedgerEntry: async (savingsId, entryId) => {
    const res = await savingsClient.deleteEntry(savingsId, entryId);
    set({
      savings: get().savings.map((s) => (s.id === savingsId ? res.data : s)),
    });
  },

  fetchInvestments: async (options) => {
    set({ isLoading: true });
    try {
      const res = await investmentsClient.getAll({ silent: options?.silent });
      set({ investments: res.data });
    } catch (e) {
      console.error('Failed to fetch investments', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addInvestment: async (i) => {
    const res = await investmentsClient.create(i);
    set({ investments: [...get().investments, res.data] });
  },

  updateInvestment: async (id, i) => {
    const prev = get().investments;
    set({
      investments: prev.map((inv) => (inv.id === id ? { ...inv, ...i } : inv)),
    });
    try {
      const res = await investmentsClient.update(id, i);
      set({ investments: get().investments.map((inv) => (inv.id === id ? res.data : inv)) });
    } catch (e) {
      set({ investments: prev });
      throw e;
    }
  },

  deleteInvestment: async (id) => {
    await investmentsClient.delete(id);
    set({ investments: get().investments.filter((i) => i.id !== id) });
  },

  fetchAiSavingsPlan: async (payload) => {
    try {
      const res = await aiFinanceClient.getSavingsRecommendations(payload);
      set({ aiSavingsPlan: res.data });
    } catch (e) {
      console.error('Failed to fetch AI Savings plan', e);
    }
  },
}));
