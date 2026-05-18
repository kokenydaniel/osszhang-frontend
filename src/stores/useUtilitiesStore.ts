import { create } from 'zustand';
import { UtilityBill, AiUtilityAnomalies } from '@/types';
import { utilitiesClient, aiFinanceClient } from '@/api';

interface UtilitiesState {
  bills: UtilityBill[];
  aiUtilityAnomalies: AiUtilityAnomalies | null;
  isLoading: boolean;

  fetchBills: () => Promise<void>;
  addBill: (b: Omit<UtilityBill, 'id'>) => Promise<void>;
  updateBill: (id: number, b: Partial<Omit<UtilityBill, 'id'>>) => Promise<void>;
  deleteBill: (id: number) => Promise<void>;
  
  fetchAiUtilityAnomalies: (year: number, month: number) => Promise<void>;
}

export const useUtilitiesStore = create<UtilitiesState>((set, get) => ({
  bills: [],
  aiUtilityAnomalies: null,
  isLoading: false,

  fetchBills: async () => {
    set({ isLoading: true });
    try {
      const res = await utilitiesClient.getAll();
      set({ bills: res.data });
    } catch (e) {
      console.error('Failed to fetch bills', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addBill: async (b) => {
    const res = await utilitiesClient.create(b);
    set({ bills: [...get().bills, res.data] });
  },

  updateBill: async (id, b) => {
    const res = await utilitiesClient.update(id, b);
    set({ bills: get().bills.map((bill) => (bill.id === id ? res.data : bill)) });
  },

  deleteBill: async (id) => {
    await utilitiesClient.delete(id);
    set({ bills: get().bills.filter((b) => b.id !== id) });
  },

  fetchAiUtilityAnomalies: async (y, m) => {
    try {
      const res = await aiFinanceClient.getUtilitiesAnomalies(y, m);
      set({ aiUtilityAnomalies: res.data });
    } catch (e) {
      console.error('Failed to fetch AI Utility anomalies', e);
    }
  },
}));
