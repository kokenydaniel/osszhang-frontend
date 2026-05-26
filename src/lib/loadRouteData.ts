import type { UserProfile } from '@/types';
import { canUseModuleWithTier, type ModuleId } from '@/lib/moduleAccess';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { getActiveWalletId } from '@/stores/useWalletStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { useMetersStore } from '@/stores/useMetersStore';

const ROUTE_MODULES: Record<string, ModuleId[]> = {
  '/': ['budget', 'utilities', 'debts', 'savings', 'meters', 'business'],
  '/budget': ['budget'],
  '/utilities': ['utilities'],
  '/debts': ['debts'],
  '/savings': ['savings'],
  '/meters': ['meters'],
  '/business': ['business'],
};

const DASHBOARD_PRIORITY: ModuleId[] = ['budget', 'utilities'];
const DASHBOARD_DEFERRED: ModuleId[] = ['debts', 'savings', 'meters', 'business'];

const loadedModules = new Set<ModuleId>();
let inflight: Promise<void> | null = null;
let inflightPath: string | null = null;

function modulesForPath(pathname: string): ModuleId[] {
  if (pathname === '/') return ROUTE_MODULES['/'];
  for (const [prefix, modules] of Object.entries(ROUTE_MODULES)) {
    if (prefix !== '/' && pathname.startsWith(prefix)) return modules;
  }
  return [];
}

async function fetchModule(moduleId: ModuleId, options?: { silent?: boolean; walletId?: number | null }): Promise<void> {
  switch (moduleId) {
    case 'budget': {
      const walletId = getActiveWalletId();
      if (walletId === null) break;
      const { selectedMonth, selectedYear } = usePreferenceStore.getState();
      const { BudgetService } = await import('@/services/BudgetService');
      await Promise.allSettled([
        BudgetService.fetchAll(walletId, { silent: options?.silent })
          .then((res) => useBudgetStore.getState().setTransactions(res.data.transactions, walletId))
          .catch(() => {}),
        BudgetService.fetchGoalRows(walletId, selectedMonth, selectedYear, { silent: options?.silent })
          .then((res) => useBudgetStore.getState().setGoalRows(res.data, selectedMonth, selectedYear, walletId))
          .catch(() => {}),
      ]);
      break;
    }
    case 'utilities':
      await useUtilitiesStore.getState().fetchBills();
      break;
    case 'meters':
      await useMetersStore.getState().fetchMeters();
      break;
    case 'business': {
      const { businessService } = await import('@/services/BusinessService');
      const { useBusinessStore } = await import('@/stores/useBusinessStore');
      await businessService
        .fetchAll({ silent: options?.silent })
        .then((orders) => {
          useBusinessStore.getState().setOrders(orders);
          useBusinessStore.getState().setLoaded(true);
        })
        .catch(() => {});
      break;
    }
    case 'debts': {
      const walletId = getActiveWalletId();
      if (walletId === null) break;
      const { debtsService } = await import('@/services/DebtsService');
      const { useDebtsStore } = await import('@/stores/useDebtsStore');
      await debtsService
        .fetchAll(walletId, { silent: options?.silent })
        .then((debts) => {
          useDebtsStore.getState().setDebts(debts, walletId);
        })
        .catch(() => {});
      break;
    }
    case 'savings': {
      const walletId = getActiveWalletId();
      if (walletId === null) break;
      const { savingsService } = await import('@/services/SavingsService');
      const { useSavingsStore } = await import('@/stores/useSavingsStore');
      await Promise.allSettled([
        savingsService
          .fetchAll(walletId, { silent: options?.silent })
          .then(({ accounts }) => useSavingsStore.getState().setSavings(accounts, walletId))
          .catch(() => {}),
        savingsService
          .fetchInvestments({ silent: options?.silent })
          .then((investments) => useSavingsStore.getState().setInvestments(investments))
          .catch(() => {}),
      ]);
      break;
    }
  }
  loadedModules.add(moduleId);
}

function enabledModules(user: UserProfile, moduleIds: ModuleId[]): ModuleId[] {
  return moduleIds.filter((id) => canUseModuleWithTier(user, id));
}

export function resetRouteDataCache() {
  loadedModules.clear();
  inflight = null;
  inflightPath = null;
}

export async function loadRouteData(pathname: string, user: UserProfile | null | undefined): Promise<void> {
  if (!user) return;

  const needed = enabledModules(user, modulesForPath(pathname)).filter((id) => !loadedModules.has(id));
  if (needed.length === 0) return;

  if (inflight && inflightPath === pathname) {
    await inflight;
    return;
  }

  inflightPath = pathname;

  if (pathname === '/') {
    const priority = needed.filter((id) => DASHBOARD_PRIORITY.includes(id));
    const deferred = needed.filter((id) => DASHBOARD_DEFERRED.includes(id));

    inflight = (async () => {
      await Promise.allSettled(priority.map((id) => fetchModule(id)));
      if (deferred.length > 0) {
        void Promise.allSettled(deferred.map((id) => fetchModule(id, { silent: true })));
      }
    })();
  } else {
    inflight = Promise.allSettled(needed.map((id) => fetchModule(id))).then(() => undefined);
  }

  try {
    await inflight;
  } finally {
    if (inflightPath === pathname) {
      inflight = null;
      inflightPath = null;
    }
  }
}
