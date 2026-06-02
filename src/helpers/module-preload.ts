import type { UserProfile } from '@/types';
import { canUseModuleWithTier, type ModuleId } from '@/helpers/module-access';
import { LoadableStatus } from '@/utils/loadable-status';
import { getActiveWalletId } from '@/helpers/wallet';
import { usePeriodStore } from '@/stores/usePeriodStore';
import { budgetStore } from '@/stores/budgetStore';
import { debtsStore } from '@/stores/debtsStore';
import { savingsStore } from '@/stores/savingsStore';
import { utilitiesStore } from '@/stores/utilitiesStore';
import { metersStore } from '@/stores/metersStore';
import { businessStore } from '@/stores/businessStore';
import { ensureUtilitiesLoaded } from '@/helpers/utilities-loader';

export type ModulePreloadOptions = {
  silent?: boolean;
  force?: boolean;
};

export async function preloadModule(
  moduleId: ModuleId,
  options?: ModulePreloadOptions,
): Promise<boolean> {
  switch (moduleId) {
    case 'budget': {
      const walletId = getActiveWalletId();
      if (walletId === null) return false;
      const { selectedYear, selectedMonth } = usePeriodStore.getState();
      await budgetStore.getState().fetch(walletId, selectedYear, selectedMonth, options?.force);
      return budgetStore.getState().status === LoadableStatus.Loaded;
    }
    case 'utilities': {
      try {
        await ensureUtilitiesLoaded({ silent: options?.silent, force: options?.force });
        return utilitiesStore.getState().status === LoadableStatus.Loaded;
      } catch {
        return false;
      }
    }
    case 'meters': {
      const { useAuthStore } = await import('@/stores/useAuthStore');
      const householdId = useAuthStore.getState().user?.household?.id;
      if (!householdId) return false;
      await metersStore.getState().fetch(householdId, options?.force);
      return metersStore.getState().status === LoadableStatus.Loaded;
    }
    case 'business': {
      const { useAuthStore } = await import('@/stores/useAuthStore');
      const householdId = useAuthStore.getState().user?.household?.id;
      if (!householdId) return false;
      await businessStore.getState().fetch(householdId, options?.force);
      return businessStore.getState().status === LoadableStatus.Loaded;
    }
    case 'debts': {
      const walletId = getActiveWalletId();
      if (walletId === null) return false;
      await debtsStore.getState().fetch(walletId, options?.force);
      return debtsStore.getState().status === LoadableStatus.Loaded;
    }
    case 'savings': {
      const walletId = getActiveWalletId();
      if (walletId === null) return false;
      await savingsStore.getState().fetch(walletId, options?.force);
      return savingsStore.getState().status === LoadableStatus.Loaded;
    }
    default:
      return false;
  }
}

export function enabledModules(user: UserProfile, moduleIds: ModuleId[]): ModuleId[] {
  return moduleIds.filter((id) => canUseModuleWithTier(user, id));
}
