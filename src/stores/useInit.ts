import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { resetRouteDataCache } from '@/lib/loadRouteData';
import { syncBudgetCategories } from '@/lib/sessionBootstrap';

interface InitState {
  initialize: () => Promise<void>;
}

export const useInitStore = create<InitState>(() => ({
  initialize: async () => {
    resetRouteDataCache();
    const user = await useAuthStore.getState().fetchMe();
    syncBudgetCategories(user);
  },
}));
