import type { UserProfile } from '@/types';
import { canUseModuleWithTier, type ModuleId } from '@/helpers/module-access';
import { LoadableStatus } from '@/utils/loadable-status';
import { ensureUtilitiesLoaded } from '@/helpers/utilities-loader';
import { budgetStore } from '@/stores/budgetStore';
import { debtsStore } from '@/stores/debtsStore';
import { savingsStore } from '@/stores/savingsStore';
import { utilitiesStore } from '@/stores/utilitiesStore';
import { metersStore } from '@/stores/metersStore';
import { businessStore } from '@/stores/businessStore';
import { insuranceStore } from '@/stores/insuranceStore';
import { rentalStore } from '@/stores/rentalStore';
import { pocketMoneyStore } from '@/stores/pocketMoneyStore';
import { receivablesStore } from '@/stores/receivablesStore';

export type ModuleFetchContext = {
  activeWalletId: number | null;
  householdId: number | null | undefined;
  selectedYear: number;
  selectedMonth: number;
};

export type ModuleFetchOptions = {
  silent?: boolean;
  force?: boolean;
};

export const DASHBOARD_MODULE_IDS: ModuleId[] = [
  'budget',
  'utilities',
  'debts',
  'savings',
  'meters',
  'business',
  'insurance',
  'rental',
  'pocket_money',
  'receivables',
];

export const DASHBOARD_FETCH_PRIORITY: ModuleId[] = ['budget', 'utilities'];
export const DASHBOARD_FETCH_DEFERRED: ModuleId[] = ['debts', 'savings', 'meters', 'business'];

export const ROUTE_MODULE_MAP: Record<string, ModuleId[]> = {
  '/': [...DASHBOARD_MODULE_IDS],
  '/budget': ['budget', 'utilities'],
  '/utilities': ['utilities'],
  '/debts': ['debts'],
  '/savings': ['savings'],
  '/meters': ['meters'],
  '/business': ['business'],
  '/receivables': ['receivables'],
  '/insurance': ['insurance'],
  '/rental': ['rental'],
  '/pocket-money': ['pocket_money'],
};

const loadedModules = new Set<ModuleId>();
let inflight: Promise<void> | null = null;
let inflightKey: string | null = null;

export function modulesForUser(
  user: UserProfile | null | undefined,
  moduleIds: readonly ModuleId[],
): ModuleId[] {
  if (!user) return [];
  return moduleIds.filter((id) => canUseModuleWithTier(user, id));
}

export function hasModuleForUser(
  user: UserProfile | null | undefined,
  moduleId: ModuleId,
): boolean {
  return canUseModuleWithTier(user, moduleId);
}

export function modulesForPath(pathname: string): ModuleId[] {
  if (pathname === '/') return ROUTE_MODULE_MAP['/'];
  for (const [prefix, modules] of Object.entries(ROUTE_MODULE_MAP)) {
    if (prefix !== '/' && pathname.startsWith(prefix)) return modules;
  }
  return [];
}

export function resetModuleDataCache(): void {
  loadedModules.clear();
  inflight = null;
  inflightKey = null;
}

async function fetchModule(
  moduleId: ModuleId,
  ctx: ModuleFetchContext,
  options?: ModuleFetchOptions,
): Promise<boolean> {
  const force = options?.force ?? false;

  switch (moduleId) {
    case 'budget': {
      if (ctx.activeWalletId === null) return false;
      await budgetStore
        .getState()
        .fetch(ctx.activeWalletId, ctx.selectedYear, ctx.selectedMonth, force);
      return budgetStore.getState().status === LoadableStatus.Loaded;
    }
    case 'utilities': {
      try {
        await ensureUtilitiesLoaded({ silent: options?.silent, force });
        return utilitiesStore.getState().status === LoadableStatus.Loaded;
      } catch {
        return false;
      }
    }
    case 'debts': {
      if (ctx.activeWalletId === null) return false;
      await debtsStore.getState().fetch(ctx.activeWalletId, force);
      return debtsStore.getState().status === LoadableStatus.Loaded;
    }
    case 'savings': {
      if (ctx.activeWalletId === null) return false;
      await savingsStore.getState().fetch(ctx.activeWalletId, force);
      return savingsStore.getState().status === LoadableStatus.Loaded;
    }
    case 'meters': {
      if (!ctx.householdId) return false;
      await metersStore.getState().fetch(ctx.householdId, force);
      return metersStore.getState().status === LoadableStatus.Loaded;
    }
    case 'business': {
      if (!ctx.householdId) return false;
      await businessStore.getState().fetch(ctx.householdId, force);
      return businessStore.getState().status === LoadableStatus.Loaded;
    }
    case 'insurance': {
      await insuranceStore.getState().fetch(force);
      return insuranceStore.getState().status === LoadableStatus.Loaded;
    }
    case 'rental': {
      await rentalStore.getState().fetch(ctx.selectedYear, ctx.selectedMonth, force);
      return rentalStore.getState().status === LoadableStatus.Loaded;
    }
    case 'pocket_money': {
      await pocketMoneyStore.getState().fetch(ctx.selectedYear, ctx.selectedMonth, force);
      return pocketMoneyStore.getState().status === LoadableStatus.Loaded;
    }
    case 'receivables': {
      await receivablesStore.getState().fetch(force);
      return receivablesStore.getState().status === LoadableStatus.Loaded;
    }
    default:
      return false;
  }
}

async function markModulesLoaded(
  moduleIds: ModuleId[],
  ctx: ModuleFetchContext,
  options?: ModuleFetchOptions,
): Promise<void> {
  const results = await Promise.all(moduleIds.map((id) => fetchModule(id, ctx, options)));
  moduleIds.forEach((id, index) => {
    if (results[index]) {
      loadedModules.add(id);
    }
  });
}

export async function ensureModulesLoaded(
  user: UserProfile | null | undefined,
  moduleIds: readonly ModuleId[],
  ctx: ModuleFetchContext,
  options?: ModuleFetchOptions & { priority?: readonly ModuleId[] },
): Promise<void> {
  if (!user) return;

  const allowed = modulesForUser(user, moduleIds);
  const needed = allowed.filter((id) => options?.force || !loadedModules.has(id));
  if (needed.length === 0) return;

  const cacheKey = `${needed.join(',')}:${ctx.activeWalletId}:${ctx.householdId}:${ctx.selectedYear}-${ctx.selectedMonth}`;
  if (inflight && inflightKey === cacheKey) {
    await inflight;
    return;
  }

  inflightKey = cacheKey;
  const priority = options?.priority ?? [];
  const priorityBatch = needed.filter((id) => priority.includes(id));
  const deferredBatch = needed.filter((id) => !priority.includes(id));

  inflight = (async () => {
    if (priorityBatch.length > 0) {
      await markModulesLoaded(priorityBatch, ctx, options);
    }
    if (deferredBatch.length > 0) {
      await markModulesLoaded(deferredBatch, ctx, { ...options, silent: true });
    }
  })();

  try {
    await inflight;
  } finally {
    if (inflightKey === cacheKey) {
      inflight = null;
      inflightKey = null;
    }
  }
}

export async function preloadModule(
  moduleId: ModuleId,
  options?: ModuleFetchOptions,
): Promise<boolean> {
  const { useAuthStore } = await import('@/stores/useAuthStore');
  const { usePeriodStore } = await import('@/stores/usePeriodStore');
  const { getActiveWalletId } = await import('@/helpers/wallet');

  const user = useAuthStore.getState().user;
  if (!hasModuleForUser(user, moduleId)) return false;

  const { selectedYear, selectedMonth } = usePeriodStore.getState();
  const before = loadedModules.has(moduleId);
  await ensureModulesLoaded(
    user,
    [moduleId],
    {
      activeWalletId: getActiveWalletId(),
      householdId: user?.household?.id,
      selectedYear,
      selectedMonth,
    },
    options,
  );
  return loadedModules.has(moduleId) || !before;
}
