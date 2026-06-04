import type { UserProfile } from '@/types';
import {
  DASHBOARD_FETCH_PRIORITY,
  ensureModulesLoaded,
  modulesForPath,
  modulesForUser,
  resetModuleDataCache,
} from '@/helpers/module-data-plan';
import { getActiveWalletId } from '@/helpers/wallet';
import { usePeriodStore } from '@/stores/usePeriodStore';

export function resetRouteDataCache(): void {
  resetModuleDataCache();
}

export async function loadRouteData(pathname: string, user: UserProfile | null | undefined): Promise<void> {
  if (!user) return;

  const moduleIds = modulesForPath(pathname);
  const needed = modulesForUser(user, moduleIds);
  if (needed.length === 0) return;

  const { selectedYear, selectedMonth } = usePeriodStore.getState();
  const ctx = {
    activeWalletId: getActiveWalletId(),
    householdId: user.household?.id,
    selectedYear,
    selectedMonth,
  };

  if (pathname === '/') {
    await ensureModulesLoaded(user, needed, ctx, {
      priority: DASHBOARD_FETCH_PRIORITY,
    });
    return;
  }

  await ensureModulesLoaded(user, needed, ctx);
}
