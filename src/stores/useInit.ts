import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useBudgetStore } from './useBudgetStore';
import { resetRouteDataCache } from '@/lib/loadRouteData';

interface InitState {
  isInitialized: boolean;
  initialize: () => Promise<void>;
}

export const useInitStore = create<InitState>((set) => ({
  isInitialized: false,

  initialize: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      resetRouteDataCache();
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
      resetRouteDataCache();
      const { fetchMe } = useAuthStore.getState();
      const dbUser = await fetchMe();

      if (dbUser) {
        const householdCats = dbUser.household?.categories?.length
          ? dbUser.household.categories
          : ['Fizetés', 'Élelmiszer', 'Rezsi'];
        useBudgetStore.getState().setCategories(householdCats);
      }
    } catch (e) {
      console.error('Initialization failed', e);
    } finally {
      set({ isInitialized: true });
    }
  },
}));
