import type { UserProfile } from '@/types';
import { canUseModuleWithTier, type ModuleId } from '@/lib/moduleAccess';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { getActiveWalletId } from '@/stores/useWalletStore';

export type ModulePreloadOptions = {
  silent?: boolean;
};

export async function preloadModule(moduleId: ModuleId, options?: ModulePreloadOptions): Promise<void> {
  switch (moduleId) {
    case 'budget': {
      const walletId = getActiveWalletId();
      if (walletId === null) break;

      const { selectedMonth, selectedYear } = usePreferenceStore.getState();
      const { ensureBudgetPeriodLoaded } = await import('@/lib/budgetDataLoader');
      await ensureBudgetPeriodLoaded(walletId, selectedMonth, selectedYear, {
        silent: options?.silent,
      }).catch(() => undefined);
      break;
    }
    case 'utilities': {
      const store = useUtilitiesStore.getState();
      if (store.isLoaded || store.isLoading) break;
      store.setLoading(true);

      const { utilitiesService } = await import('@/services/UtilitiesService');
      await utilitiesService
        .fetchAll({ silent: options?.silent })
        .then((index) => {
          useUtilitiesStore.getState().setUtilities(index);
          useUtilitiesStore.getState().setLoaded(true);
        })
        .catch(() => useUtilitiesStore.getState().setLoading(false));
      break;
    }
    case 'meters': {
      const { useMetersStore } = await import('@/stores/useMetersStore');
      const store = useMetersStore.getState();
      if (store.isLoaded || store.isLoading) break;
      store.setLoading(true);

      const { metersService } = await import('@/services/MetersService');
      await metersService
        .fetchAll({ silent: options?.silent })
        .then((meters) => {
          useMetersStore.getState().setMeters(meters);
          useMetersStore.getState().setLoaded(true);
        })
        .catch(() => useMetersStore.getState().setLoading(false));
      break;
    }
    case 'business': {
      const { useBusinessStore } = await import('@/stores/useBusinessStore');
      const store = useBusinessStore.getState();
      if (store.isLoaded || store.isLoading) break;
      store.setLoading(true);

      const { businessService } = await import('@/services/BusinessService');
      await businessService
        .fetchAll({ silent: options?.silent })
        .then((orders) => {
          useBusinessStore.getState().setOrders(orders);
          useBusinessStore.getState().setLoaded(true);
        })
        .catch(() => useBusinessStore.getState().setLoading(false));
      break;
    }
    case 'debts': {
      const walletId = getActiveWalletId();
      if (walletId === null) break;

      const { useDebtsStore } = await import('@/stores/useDebtsStore');
      const store = useDebtsStore.getState();
      if (store.isLoading || (store.loadedWalletId === walletId && !store.isLoading)) break;
      store.setLoading(true, walletId);

      const { debtsService } = await import('@/services/DebtsService');
      await debtsService
        .fetchAll(walletId, { silent: options?.silent })
        .then((debts) => useDebtsStore.getState().setDebts(debts, walletId))
        .catch(() => useDebtsStore.getState().setLoading(false));
      break;
    }
    case 'savings': {
      const walletId = getActiveWalletId();
      if (walletId === null) break;

      const { useSavingsStore } = await import('@/stores/useSavingsStore');
      const store = useSavingsStore.getState();
      if (store.isLoading || store.loadedWalletId === walletId) break;
      store.setLoading(true, walletId);

      const { savingsService } = await import('@/services/SavingsService');
      await Promise.allSettled([
        savingsService
          .fetchAll(walletId, { silent: options?.silent })
          .then(({ accounts }) => useSavingsStore.getState().setSavings(accounts, walletId))
          .catch(() => useSavingsStore.getState().setLoading(false)),
        savingsService
          .fetchInvestments({ silent: options?.silent })
          .then((investments) => useSavingsStore.getState().setInvestments(investments))
          .catch(() => {}),
      ]);
      break;
    }
  }
}

export function enabledModules(user: UserProfile, moduleIds: ModuleId[]): ModuleId[] {
  return moduleIds.filter((id) => canUseModuleWithTier(user, id));
}
