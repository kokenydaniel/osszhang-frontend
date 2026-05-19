import { create } from 'zustand';
import { Investment } from '@/types';
import { investmentsClient } from '@/api/investmentsClient';
import { useNotificationStore } from './useNotificationStore';

interface InvestmentsState {
  investments: Investment[];
  isLoading: boolean;
  fetchInvestments: () => Promise<void>;
  addInvestment: (inv: Omit<Investment, 'id'>) => Promise<void>;
  updateInvestment: (id: number, inv: Partial<Omit<Investment, 'id'>>) => Promise<void>;
  deleteInvestment: (id: number) => Promise<void>;
}

export const useInvestmentsStore = create<InvestmentsState>((set, get) => ({
  investments: [],
  isLoading: false,

  fetchInvestments: async () => {
    set({ isLoading: true });
    try {
      const res = await investmentsClient.getAll();
      set({ investments: res.data });
    } catch (error) {
      console.error('Failed to fetch investments', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addInvestment: async (inv) => {
    try {
      const res = await investmentsClient.create(inv);
      set({ investments: [...get().investments, res.data] });
    } catch (e) {
      console.error(e);
      useNotificationStore.getState().addNotification('Hiba a befektetés mentésekor', 'error');
    }
  },

  updateInvestment: async (id, inv) => {
    try {
      const res = await investmentsClient.update(id, inv);
      set({ investments: get().investments.map(i => i.id === id ? res.data : i) });
    } catch (e) {
      console.error(e);
      useNotificationStore.getState().addNotification('Hiba a befektetés frissítésekor', 'error');
    }
  },

  deleteInvestment: async (id) => {
    try {
      await investmentsClient.delete(id);
      set({ investments: get().investments.filter(i => i.id !== id) });
    } catch (e) {
      console.error(e);
      useNotificationStore.getState().addNotification('Hiba a befektetés törlésekor', 'error');
    }
  }
}));
