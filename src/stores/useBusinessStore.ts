import { create } from 'zustand';
import type { BusinessOrder } from '@/types/business';

interface BusinessState {
  orders: BusinessOrder[];
  isLoading: boolean;
  isLoaded: boolean;

  setOrders: (orders: BusinessOrder[]) => void;
  setLoading: (loading: boolean) => void;
  setLoaded: (loaded: boolean) => void;
  appendOrder: (order: BusinessOrder) => void;
  patchOrder: (id: number, updated: BusinessOrder) => void;
  removeOrder: (id: number) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  orders: [] as BusinessOrder[],
  isLoading: false,
  isLoaded: false,
};

export const useBusinessStore = create<BusinessState>((set) => ({
  ...INITIAL_STATE,

  setOrders: (orders) => set({ orders, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setLoaded: (isLoaded) => set({ isLoaded }),
  appendOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
  patchOrder: (id, updated) =>
    set((state) => ({
      orders: state.orders.map((order) => (order.id === id ? updated : order)),
    })),
  removeOrder: (id) => set((state) => ({ orders: state.orders.filter((order) => order.id !== id) })),
  reset: () => set(INITIAL_STATE),
}));
