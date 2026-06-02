import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { resetSessionData } from '@/helpers/reset-session-data';
import { syncBudgetCategories } from '@/helpers/session-bootstrap';

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
