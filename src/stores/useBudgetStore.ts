import { create } from 'zustand';
import { CashTransaction, AiOverspendAnalysis, AiCashflowForecast, AiWeeklyBriefing, LedgerEntry } from '@/types';
import { budgetClient, householdClient, aiFinanceClient } from '@/api';
import { useNotificationStore } from './useNotificationStore';

interface BudgetState {
  transactions: CashTransaction[];
  categories: string[];
  aiOverspend: AiOverspendAnalysis | null;
  aiCashflowForecast: AiCashflowForecast | null;
  aiWeeklyBriefing: AiWeeklyBriefing | null;
  isLoading: boolean;

  fetchTransactions: () => Promise<void>;
  addTransaction: (tx: Omit<CashTransaction, 'id'>) => Promise<void>;
  updateTransaction: (id: number, tx: Partial<Omit<CashTransaction, 'id' | 'subItems'>>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  
  addSubItem: (txId: number, item: Omit<LedgerEntry, 'id'>) => Promise<void>;
  deleteSubItem: (txId: number, itemId: number) => Promise<void>;
  
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  
  clonePreviousMonth: (month: number, year: number) => Promise<void>;
  
  fetchAiOverspend: (year: number, month: number) => Promise<void>;
  fetchAiCashflowForecast: (year: number, month: number) => Promise<void>;
  fetchAiWeeklyBriefing: (weekStart?: string) => Promise<void>;
  
  setCategories: (categories: string[]) => void;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  transactions: [],
  categories: [],
  aiOverspend: null,
  aiCashflowForecast: null,
  aiWeeklyBriefing: null,
  isLoading: false,

  fetchTransactions: async () => {
    set({ isLoading: true });
    try {
      const res = await budgetClient.getAll();
      set({ transactions: res.data });
    } catch (e) {
      console.error('Failed to fetch transactions', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addTransaction: async (tx) => {
    const res = await budgetClient.create(tx);
    set({ transactions: [...get().transactions, res.data] });
  },

  updateTransaction: async (id, tx) => {
    const res = await budgetClient.update(id, tx);
    set({ transactions: get().transactions.map((t) => (t.id === id ? res.data : t)) });
  },

  deleteTransaction: async (id) => {
    await budgetClient.delete(id);
    set({ transactions: get().transactions.filter((t) => t.id !== id) });
  },

  addSubItem: async (txId, item) => {
    const res = await budgetClient.addItem(txId, item);
    set({ transactions: get().transactions.map((t) => (t.id === txId ? res.data : t)) });
  },

  deleteSubItem: async (txId, itemId) => {
    const res = await budgetClient.deleteItem(txId, itemId);
    set({ transactions: get().transactions.map((t) => (t.id === txId ? res.data : t)) });
  },

  addCategory: async (name) => {
    const updated = [...get().categories, name];
    await householdClient.updateCategories(updated);
    set({ categories: updated });
  },

  deleteCategory: async (name) => {
    const updated = get().categories.filter((c) => c !== name);
    await householdClient.updateCategories(updated);
    set({ categories: updated });
  },

  clonePreviousMonth: async (m, y) => {
    await budgetClient.create({ type: 'clone', month: m, year: y });
    const res = await budgetClient.getAll();
    set({ transactions: res.data });
  },

  fetchAiOverspend: async (y, m) => {
    try {
      const res = await aiFinanceClient.getOverspendRootCause(y, m);
      set({ aiOverspend: res.data });
    } catch (e) {
      console.error('Failed to fetch AI Overspend analysis', e);
    }
  },

  fetchAiCashflowForecast: async (y, m) => {
    try {
      const res = await aiFinanceClient.getCashflowForecast(y, m);
      set({ aiCashflowForecast: res.data });
    } catch (e) {
      console.error('Failed to fetch AI Cashflow forecast', e);
    }
  },

  fetchAiWeeklyBriefing: async (weekStart) => {
    try {
      const res = await aiFinanceClient.getWeeklyBriefing(weekStart);
      set({ aiWeeklyBriefing: res.data });
    } catch (e) {
      console.error('Failed to fetch AI Weekly Briefing', e);
    }
  },

  setCategories: (categories) => set({ categories }),
}));
