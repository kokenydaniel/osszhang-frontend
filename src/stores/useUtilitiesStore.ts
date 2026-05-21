import { create } from 'zustand';
import { UtilityBill, UtilitySettlement, AiUtilityAnomalies } from '@/types';
import { utilitiesClient, aiFinanceClient } from '@/lib/api-client';
import { parseUtilitiesIndexResponse } from '@/lib/parseUtilitiesResponse';
import { unwrapApiData } from '@/lib/unwrapApiData';

interface UtilitiesState {
  bills: UtilityBill[];
  settlements: UtilitySettlement[];
  aiUtilityAnomalies: AiUtilityAnomalies | null;
  isLoading: boolean;

  fetchBills: () => Promise<void>;
  addBill: (b: Omit<UtilityBill, 'id'>) => Promise<void>;
  updateBill: (id: number, b: Partial<Omit<UtilityBill, 'id'>>) => Promise<void>;
  deleteBill: (id: number) => Promise<void>;
  clonePreviousMonth: (month: number, year: number) => Promise<void>;
  settleMonth: (month: number, year: number) => Promise<UtilitySettlement>;
  unsettleMonth: (month: number, year: number) => Promise<void>;

  fetchAiUtilityAnomalies: (year: number, month: number) => Promise<void>;
}

export const useUtilitiesStore = create<UtilitiesState>((set, get) => ({
  bills: [],
  settlements: [],
  aiUtilityAnomalies: null,
  isLoading: false,

  fetchBills: async () => {
    set({ isLoading: true });
    try {
      const res = await utilitiesClient.getAll();
      const parsed = parseUtilitiesIndexResponse(res.data);
      set({ bills: parsed.bills, settlements: parsed.settlements });
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
    const previous = get().bills;
    const current = previous.find((bill) => bill.id === id);
    if (!current) return;

    const optimistic = { ...current, ...b };
    set({ bills: previous.map((bill) => (bill.id === id ? optimistic : bill)) });

    try {
      const res = await utilitiesClient.update(id, b);
      set({ bills: get().bills.map((bill) => (bill.id === id ? res.data : bill)) });
    } catch (e) {
      set({ bills: previous });
      console.error('Failed to update bill', e);
      throw e;
    }
  },

  clonePreviousMonth: async (m, y) => {
    const res = await utilitiesClient.cloneMonth(m, y);
    const parsed = parseUtilitiesIndexResponse(res.data);
    set({ bills: parsed.bills, settlements: parsed.settlements });
  },

  settleMonth: async (m, y) => {
    const res = await utilitiesClient.settleMonth(m, y);
    const parsed = parseUtilitiesIndexResponse(res.data);
    set({ bills: parsed.bills, settlements: parsed.settlements });
    const settlement = (res.data as { settlement?: UtilitySettlement }).settlement;
    if (!settlement) {
      throw new Error('Missing settlement in API response');
    }
    return settlement;
  },

  unsettleMonth: async (m, y) => {
    const res = await utilitiesClient.unsettleMonth(m, y);
    const parsed = parseUtilitiesIndexResponse(res.data);
    set({ bills: parsed.bills, settlements: parsed.settlements });
  },

  deleteBill: async (id) => {
    await utilitiesClient.delete(id);
    set({ bills: get().bills.filter((b) => b.id !== id) });
  },

  fetchAiUtilityAnomalies: async (y, m) => {
    try {
      const res = await aiFinanceClient.getUtilitiesAnomalies(y, m);
      set({ aiUtilityAnomalies: unwrapApiData<AiUtilityAnomalies>(res.data) });
    } catch (e) {
      console.error('Failed to fetch AI Utility anomalies', e);
    }
  },
}));
