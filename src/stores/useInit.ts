import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { resetSessionData } from '@/lib/resetSessionData';
import { syncBudgetCategories } from '@/lib/sessionBootstrap';

interface InitState {
  initialize: () => Promise<void>;
}

export const useInitStore = create<InitState>(() => ({
  initialize: async () => {
    resetSessionData();
    const user = await useAuthStore.getState().fetchMe();
    syncBudgetCategories(user);
  },
}));
