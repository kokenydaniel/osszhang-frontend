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
        
        // 2. Fetch only stores the user has permission to view, in parallel
        const permissions = dbUser.permissions || [];
        const isAdmin = dbUser.role === 'admin';
        const hasPermission = (moduleName: string) => isAdmin || permissions.includes(moduleName);

        const fetchPromises: Promise<any>[] = [];

        if (hasPermission('budget')) {
          fetchPromises.push(useBudgetStore.getState().fetchTransactions());
        }
        if (hasPermission('utilities')) {
          fetchPromises.push(useUtilitiesStore.getState().fetchBills());
        }
        if (hasPermission('meters')) {
          fetchPromises.push(useMetersStore.getState().fetchMeters());
        }
        if (hasPermission('business')) {
          fetchPromises.push(useBusinessStore.getState().fetchOrders());
        }
        if (hasPermission('debts')) {
          fetchPromises.push(useDebtsStore.getState().fetchDebts());
        }
        if (hasPermission('savings')) {
          fetchPromises.push(useSavingsStore.getState().fetchSavings());
          fetchPromises.push(useSavingsStore.getState().fetchInvestments());
        }

        await Promise.all(fetchPromises);
      }
    } catch (e) {
      console.error('Initialization failed', e);
    } finally {
      set({ isInitialized: true });
    }
  },
}));
