import type { UserProfile } from '@/types';
import { canAccessModule, type ModuleId } from '@/lib/moduleAccess';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useUtilitiesStore } from '@/stores/useUtilitiesStore';
import { useMetersStore } from '@/stores/useMetersStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useDebtsStore } from '@/stores/useDebtsStore';
import { useSavingsStore } from '@/stores/useSavingsStore';

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

async function fetchModule(moduleId: ModuleId, options?: { silent?: boolean }): Promise<void> {
  switch (moduleId) {
    case 'budget':
      await useBudgetStore.getState().fetchTransactions();
      break;
    case 'utilities':
      await useUtilitiesStore.getState().fetchBills();
      break;
    case 'meters':
      await useMetersStore.getState().fetchMeters();
      break;
    case 'business':
      await useBusinessStore.getState().fetchOrders();
      break;
    case 'debts':
      await useDebtsStore.getState().fetchDebts();
      break;
    case 'savings':
      await Promise.allSettled([
        useSavingsStore.getState().fetchSavings({ silent: options?.silent }),
        useSavingsStore.getState().fetchInvestments({ silent: options?.silent }),
      ]);
      break;
  }
  loadedModules.add(moduleId);
}

function enabledModules(user: UserProfile, moduleIds: ModuleId[]): ModuleId[] {
  return moduleIds.filter((id) => canAccessModule(user, id));
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
