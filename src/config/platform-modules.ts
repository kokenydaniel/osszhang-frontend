import config from '@/config/config';
import type { ModuleId } from '@/config/config';
import { isPlatformAdmin } from '@/config/platform-admin';
import type { UserProfile } from '@/types';

export function platformModuleFlagKey(moduleId: ModuleId): string {
  return `enable_module_${moduleId}`;
}

/** Nyers flag érték — lifetime adminnál is a tényleges platform állapot. */
export function isPlatformModuleReleased(user: UserProfile | null | undefined, moduleId: ModuleId): boolean {
  if (moduleId === 'budget') return true;
  if (!user) return false;

  const flag = user.platform_feature_flags?.[platformModuleFlagKey(moduleId)];
  if (flag === undefined) return true;

  return Boolean(flag);
}

/** Sima usernek: modul még nincs kiadva platform szinten. */
export function isModuleComingSoon(user: UserProfile | null | undefined, moduleId: ModuleId): boolean {
  if (!user || isPlatformAdmin(user) || moduleId === 'budget') return false;
  return !isPlatformModuleReleased(user, moduleId);
}

/** Megjelenítéshez — lifetime admin „felhasználói előnézet” módban is mutatja a Hamarosan állapotot. */
export function isModuleComingSoonForDisplay(
  user: UserProfile | null | undefined,
  moduleId: ModuleId,
  previewAsRegularUser = false,
): boolean {
  if (moduleId === 'budget' || !user) return false;
  if (previewAsRegularUser && isPlatformAdmin(user)) {
    return !isPlatformModuleReleased(user, moduleId);
  }
  return isModuleComingSoon(user, moduleId);
}

/** Lifetime admin: modul még nincs kiadva, de ő tesztelheti. */
export function isPlatformModulePreviewForAdmin(
  user: UserProfile | null | undefined,
  moduleId: ModuleId,
): boolean {
  if (!user || !isPlatformAdmin(user) || moduleId === 'budget') return false;
  return !isPlatformModuleReleased(user, moduleId);
}

/** Megjelenítéshez — felhasználói előnézetben elrejti a Fejlesztés alatt badge-et. */
export function isPlatformModulePreviewForAdminDisplay(
  user: UserProfile | null | undefined,
  moduleId: ModuleId,
  previewAsRegularUser = false,
): boolean {
  if (previewAsRegularUser) return false;
  return isPlatformModulePreviewForAdmin(user, moduleId);
}

export const PLATFORM_MODULE_IDS = config.modules.ids;

export const PLATFORM_MODULE_META: Record<
  ModuleId,
  { label: string; description: string; tier?: 'pro' | 'premium' }
> = {
  budget: {
    label: config.modules.labels.budget,
    description: 'Mindig elérhető — a pénzügyi alapmodul.',
  },
  savings: {
    label: config.modules.labels.savings,
    description: 'Megtakarítások, célok, egyenlegek.',
    tier: 'pro',
  },
  debts: {
    label: config.modules.labels.debts,
    description: 'Hitelek és törlesztési tervek.',
    tier: 'pro',
  },
  utilities: {
    label: config.modules.labels.utilities,
    description: 'Rezsi számlák és sablonok.',
    tier: 'pro',
  },
  meters: {
    label: config.modules.labels.meters,
    description: 'Közműórák és fogyasztás.',
    tier: 'pro',
  },
  business: {
    label: config.modules.labels.business,
    description: 'Vállalkozás, rendelések, importok.',
    tier: 'premium',
  },
  pocket_money: {
    label: config.modules.labels.pocket_money,
    description: 'Családtagok zsebpénze.',
    tier: 'pro',
  },
  insurance: {
    label: config.modules.labels.insurance,
    description: 'Biztosítási szerződések.',
    tier: 'pro',
  },
  rental: {
    label: config.modules.labels.rental,
    description: 'Bérbe adott ingatlanok.',
    tier: 'pro',
  },
  receivables: {
    label: config.modules.labels.receivables,
    description: 'Kintlévőségek nyilvántartása.',
    tier: 'pro',
  },
  travel_planner: {
    label: config.modules.labels.travel_planner,
    description: 'AI utazásköltség-tervező.',
    tier: 'premium',
  },
};
