import type { UserProfile } from '@/types';
import type { ModuleId } from '@/lib/moduleAccess';
import { enabledModules, preloadModule } from '@/lib/modulePreload';

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

  const markLoaded = async (moduleIds: ModuleId[], options?: { silent?: boolean }) => {
    await Promise.allSettled(moduleIds.map((id) => preloadModule(id, options)));
    moduleIds.forEach((id) => loadedModules.add(id));
  };

  if (pathname === '/') {
    const priority = needed.filter((id) => DASHBOARD_PRIORITY.includes(id));
    const deferred = needed.filter((id) => DASHBOARD_DEFERRED.includes(id));

    inflight = (async () => {
      await markLoaded(priority);
      if (deferred.length > 0) {
        void markLoaded(deferred, { silent: true });
      }
    })();
  } else {
    inflight = markLoaded(needed).then(() => undefined);
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
