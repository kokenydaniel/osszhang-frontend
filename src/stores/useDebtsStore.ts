import { create } from 'zustand';
import { Debt, AiDebtPlan } from '@/types';
import { debtsClient, aiFinanceClient } from '@/api';

interface DebtsState {
  debts: Debt[];
  aiDebtPlan: AiDebtPlan | null;
  isLoading: boolean;

  fetchDebts: () => Promise<void>;
  addDebt: (d: Omit<Debt, 'id'>) => Promise<void>;
  updateDebt: (id: number, d: Partial<Omit<Debt, 'id'>>) => Promise<void>;
  deleteDebt: (id: number) => Promise<void>;
  
  fetchAiDebtPlan: (strategy?: 'avalanche' | 'snowball') => Promise<void>;
}

export const useDebtsStore = create<DebtsState>((set, get) => ({
  debts: [],
  aiDebtPlan: null,
  isLoading: false,

  fetchDebts: async () => {
    set({ isLoading: true });
    try {
      const res = await debtsClient.getAll();
      set({ debts: res.data });
    } catch (e) {
      console.error('Failed to fetch debts', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addDebt: async (d) => {
    const res = await debtsClient.create(d);
    set({ debts: [...get().debts, res.data] });
  },

  updateDebt: async (id, d) => {
    const res = await debtsClient.update(id, d);
    set({ debts: get().debts.map((debt) => (debt.id === id ? res.data : debt)) });
  },

  deleteDebt: async (id) => {
    await debtsClient.delete(id);
    set({ debts: get().debts.filter((d) => d.id !== id) });
  },

  fetchAiDebtPlan: async (strategy) => {
    try {
      const res = await aiFinanceClient.optimizeDebts({ strategy });
      set({ aiDebtPlan: res.data });
    } catch (e) {
      console.error('Failed to fetch AI Debt optimization strategy', e);
    }
  },
}));
