import { create } from 'zustand';
import { isMaintenanceBlockedForUser } from '@/config/platform-feature-flags';
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
    if (user && !isMaintenanceBlockedForUser(user)) {
      syncBudgetCategories(user);
    }
  },
}));
