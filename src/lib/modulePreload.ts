import type { UserProfile } from '@/types';
import { canUseModuleWithTier, type ModuleId } from '@/lib/moduleAccess';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { getActiveWalletId } from '@/stores/useWalletStore';

export type ModulePreloadOptions = {
  silent?: boolean;
};

export async function preloadModule(
  moduleId: ModuleId,
  options?: ModulePreloadOptions,
): Promise<boolean> {
  switch (moduleId) {
    case 'budget': {
      const walletId = getActiveWalletId();
      if (walletId === null) return false;

      const { selectedMonth, selectedYear } = usePreferenceStore.getState();
      const { ensureBudgetPeriodLoaded } = await import('@/lib/budgetDataLoader');
      try {
        await ensureBudgetPeriodLoaded(walletId, selectedMonth, selectedYear, {
          silent: options?.silent,
        });
        return true;
      } catch {
        return false;
      }
    }
    case 'utilities': {
      const { ensureUtilitiesLoaded } = await import('@/lib/utilitiesDataLoader');
      try {
        await ensureUtilitiesLoaded({ silent: options?.silent });
        return useUtilitiesStore.getState().isLoaded;
      } catch {
        return false;
      }
    }
    case 'meters': {
      const { useMetersStore } = await import('@/stores/useMetersStore');
      const store = useMetersStore.getState();
      if (store.isLoaded) return true;
      if (store.isLoading) {
        await waitForModuleLoaded(() => useMetersStore.getState().isLoaded);
        return useMetersStore.getState().isLoaded;
      }
      store.setLoading(true);

      const { metersService } = await import('@/services/MetersService');
      try {
        const meters = await metersService.fetchAll({ silent: options?.silent });
        useMetersStore.getState().setMeters(meters);
        return true;
      } catch {
        useMetersStore.getState().setLoading(false);
        return false;
      }
    }
    case 'business': {
      const { useBusinessStore } = await import('@/stores/useBusinessStore');
      const store = useBusinessStore.getState();
      if (store.isLoaded) return true;
      if (store.isLoading) {
        await waitForModuleLoaded(() => useBusinessStore.getState().isLoaded);
        return useBusinessStore.getState().isLoaded;
      }
      store.setLoading(true);

      const { businessService } = await import('@/services/BusinessService');
      try {
        const orders = await businessService.fetchAll({ silent: options?.silent });
        useBusinessStore.getState().setOrders(orders);
        useBusinessStore.getState().setLoaded(true);
        return true;
      } catch {
        useBusinessStore.getState().setLoading(false);
        return false;
      }
    }
    case 'debts': {
      const walletId = getActiveWalletId();
      if (walletId === null) return false;

      const { useDebtsStore } = await import('@/stores/useDebtsStore');
      const store = useDebtsStore.getState();
      if (!store.isLoading && store.loadedWalletId === walletId) return true;
      if (store.isLoading) {
        await waitForModuleLoaded(
          () => useDebtsStore.getState().loadedWalletId === walletId && !useDebtsStore.getState().isLoading,
        );
        return useDebtsStore.getState().loadedWalletId === walletId;
      }
      store.setLoading(true, walletId);

      const { debtsService } = await import('@/services/DebtsService');
      try {
        const debts = await debtsService.fetchAll(walletId, { silent: options?.silent });
        useDebtsStore.getState().setDebts(debts, walletId);
        return true;
      } catch {
        useDebtsStore.getState().setLoading(false);
        return false;
      }
    }
    case 'savings': {
      const walletId = getActiveWalletId();
      if (walletId === null) return false;

      const { useSavingsStore } = await import('@/stores/useSavingsStore');
      const store = useSavingsStore.getState();
      if (!store.isLoading && store.loadedWalletId === walletId) return true;
      if (store.isLoading) {
        await waitForModuleLoaded(
          () => useSavingsStore.getState().loadedWalletId === walletId && !useSavingsStore.getState().isLoading,
        );
        return useSavingsStore.getState().loadedWalletId === walletId;
      }
      store.setLoading(true, walletId);

      const { savingsService } = await import('@/services/SavingsService');
      try {
        const [accountsResult, investmentsResult] = await Promise.allSettled([
          savingsService.fetchAll(walletId, { silent: options?.silent }),
          savingsService.fetchInvestments({ silent: options?.silent }),
        ]);

        if (accountsResult.status === 'rejected') {
          useSavingsStore.getState().setLoading(false);
          return false;
        }

        useSavingsStore.getState().setSavings(accountsResult.value.accounts, walletId);
        if (investmentsResult.status === 'fulfilled') {
          useSavingsStore.getState().setInvestments(investmentsResult.value);
        }
        return true;
      } catch {
        useSavingsStore.getState().setLoading(false);
        return false;
      }
    }
    default:
      return false;
  }
}

function waitForModuleLoaded(isReady: () => boolean, timeoutMs = 30_000): Promise<void> {
  return new Promise((resolve) => {
    if (isReady()) {
      resolve();
      return;
    }

    const started = Date.now();
    const timer = setInterval(() => {
      if (isReady() || Date.now() - started >= timeoutMs) {
        clearInterval(timer);
        resolve();
      }
    }, 50);
  });
}

export function enabledModules(user: UserProfile, moduleIds: ModuleId[]): ModuleId[] {
  return moduleIds.filter((id) => canUseModuleWithTier(user, id));
}
