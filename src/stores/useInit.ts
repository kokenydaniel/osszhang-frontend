import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useBudgetStore } from './useBudgetStore';
import { useUtilitiesStore } from './useUtilitiesStore';
import { useMetersStore } from './useMetersStore';
import { useBusinessStore } from './useBusinessStore';
import { useDebtsStore } from './useDebtsStore';
import { useSavingsStore } from './useSavingsStore';

interface InitState {
  isInitialized: boolean;
  initialize: () => Promise<void>;
}

export const useInitStore = create<InitState>((set) => ({
  isInitialized: false,
  
  initialize: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login';
      }
      set({ isInitialized: true });
      return;
    }

    try {
      // 1. First fetch user details and set up permissions/household categories
      const { fetchMe, user } = useAuthStore.getState();
      const dbUser = await fetchMe();
      
      if (dbUser) {
        // Set household categories in the budget store
        const defaultCats = [
          'Fizetés',
          'Kaja',
          'Tankolás',
          'Rezsi',
          'Kevin',
          'Hitel',
          'Autó',
          'Streaming, Subscriptions',
          'Little Loom',
        ];
        const householdCats = dbUser.household?.categories || defaultCats;
        useBudgetStore.getState().setCategories(householdCats);
        
        // 2. Fetch all other stores in parallel to optimize initial load
        await Promise.all([
          useBudgetStore.getState().fetchTransactions(),
          useUtilitiesStore.getState().fetchBills(),
          useMetersStore.getState().fetchMeters(),
          useBusinessStore.getState().fetchOrders(),
          useDebtsStore.getState().fetchDebts(),
          useSavingsStore.getState().fetchSavings(),
        ]);
      }
    } catch (e) {
      console.error('Initialization failed', e);
    } finally {
      set({ isInitialized: true });
    }
  },
}));
