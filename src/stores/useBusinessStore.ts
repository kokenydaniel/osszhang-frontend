import { create } from 'zustand';
import { BusinessOrder } from '@/types';
import { businessClient } from '@/api';
import { useNotificationStore } from './useNotificationStore';

interface BusinessState {
  orders: BusinessOrder[];
  isLoading: boolean;

  fetchOrders: () => Promise<void>;
  addOrder: (o: Omit<BusinessOrder, 'id'>) => Promise<void>;
  updateOrder: (id: number, o: Partial<Omit<BusinessOrder, 'id'>>) => Promise<void>;
  deleteOrder: (id: number) => Promise<void>;
  shopifyImport: () => Promise<void>;
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  orders: [],
  isLoading: false,

  fetchOrders: async () => {
    set({ isLoading: true });
    try {
      const res = await businessClient.getAll();
      set({ orders: res.data });
    } catch (e) {
      console.error('Failed to fetch business orders', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addOrder: async (o) => {
    const res = await businessClient.create(o);
    set({ orders: [...get().orders, res.data] });
  },

  updateOrder: async (id, o) => {
    const res = await businessClient.update(id, o);
    set({ orders: get().orders.map((order) => (order.id === id ? res.data : order)) });
  },

  deleteOrder: async (id) => {
    await businessClient.delete(id);
    set({ orders: get().orders.filter((o) => o.id !== id) });
  },

  shopifyImport: async () => {
    const { addNotification } = useNotificationStore.getState();
    addNotification('Shopify rendelések importálása elindult...', 'info');
    try {
      await businessClient.shopifyImport();
      const res = await businessClient.getAll();
      set({ orders: res.data });
      addNotification('Shopify rendelések sikeresen szinkronizálva!', 'success');
    } catch (e) {
      addNotification('Shopify importálás sikertelen volt.', 'error');
    }
  },
}));
