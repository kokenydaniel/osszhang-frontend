import { create } from 'zustand';
import { SavingsAccount, AiSavingsPlan, LedgerEntry } from '@/types';
import { savingsClient, aiFinanceClient } from '@/api';

interface SavingsState {
  savings: SavingsAccount[];
  aiSavingsPlan: AiSavingsPlan | null;
  isLoading: boolean;

  fetchSavings: () => Promise<void>;
  addSavingsAccount: (s: Omit<SavingsAccount, 'id' | 'ledger'>) => Promise<void>;
  updateSavingsAccount: (id: number, s: Partial<Omit<SavingsAccount, 'id' | 'ledger'>>) => Promise<void>;
  deleteSavingsAccount: (id: number) => Promise<void>;
  
  addLedgerEntry: (savingsId: number, entry: Omit<LedgerEntry, 'id'>) => Promise<void>;
  deleteLedgerEntry: (savingsId: number, entryId: number) => Promise<void>;
  
  fetchAiSavingsPlan: (payload: {
    goals: Array<{ name: string; target_amount: number; target_date: string; priority?: number }>;
    constraints?: { min_buffer?: number };
  }) => Promise<void>;
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  savings: [],
  aiSavingsPlan: null,
  isLoading: false,

  fetchSavings: async () => {
    set({ isLoading: true });
    try {
      const res = await savingsClient.getAll();
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
    const res = await savingsClient.update(id, s);
    set({ savings: get().savings.map((acc) => (acc.id === id ? res.data : acc)) });
  },

  deleteSavingsAccount: async (id) => {
    await savingsClient.delete(id);
    set({ savings: get().savings.filter((s) => s.id !== id) });
  },

  addLedgerEntry: async (savingsId, entry) => {
    const res = await savingsClient.addEntry(savingsId, entry);
    set({
      savings: get().savings.map((s) =>
        s.id === savingsId ? { ...s, ledger: [...(s.ledger || []), res.data] } : s
      ),
    });
  },

  deleteLedgerEntry: async (savingsId, entryId) => {
    await savingsClient.deleteEntry(savingsId, entryId);
    set({
      savings: get().savings.map((s) =>
        s.id === savingsId ? { ...s, ledger: (s.ledger || []).filter((e) => e.id !== entryId) } : s
      ),
    });
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
