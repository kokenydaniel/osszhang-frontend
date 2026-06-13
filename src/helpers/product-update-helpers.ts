import config from '@/config/config';
import { canAccessModuleByTier } from '@/helpers/check-access';
import {
  isHouseholdModuleId,
  isModuleEnabled,
  type ModuleId,
} from '@/helpers/module-access';
import { ONBOARDING_MODULE_TIERS } from '@/helpers/household-onboarding';
import type { ProductUpdate, ProductUpdateKind } from '@/types/admin';
import type { UserProfile } from '@/types';

const MODULE_ROUTES: Partial<Record<ModuleId, string>> = {
  budget: '/budget',
  savings: '/savings',
  debts: '/debts',
  utilities: '/utilities',
  meters: '/meters',
  business: '/business',
  pocket_money: '/pocket-money',
  insurance: '/insurance',
  rental: '/rental',
  receivables: '/receivables',
  travel_planner: '/tools/travel',
};

export const PRODUCT_UPDATE_KIND_LABELS: Record<ProductUpdateKind, string> = {
  new: 'Új',
  update: 'Frissítés',
  tip: 'Tipp',
  general: 'Hírek',
};

export type ProductUpdateCta =
  | { type: 'link'; label: string; href: string }
  | { type: 'upgrade'; label: string; requiredTier: 'pro' | 'premium'; moduleId?: ModuleId };

export function resolveProductUpdateCta(
  user: UserProfile | null | undefined,
  update: ProductUpdate,
): ProductUpdateCta | null {
  if (update.cta_label?.trim() && update.cta_href?.trim()) {
    return {
      type: 'link',
      label: update.cta_label.trim(),
      href: update.cta_href.trim(),
    };
  }

  if (!update.module_id || !isHouseholdModuleId(update.module_id) || !user) {
    return null;
  }

  const moduleId = update.module_id;
  const moduleLabel = config.modules.labels[moduleId] ?? moduleId;

  if (!canAccessModuleByTier(user, moduleId)) {
    return {
      type: 'upgrade',
      label: `${moduleLabel} — csomag frissítés`,
      requiredTier: productUpdateModuleTier(moduleId) ?? 'pro',
      moduleId,
    };
  }

  if (!isModuleEnabled(user.household, moduleId)) {
    return {
      type: 'link',
      label: 'Modul bekapcsolása',
      href: '/settings?tab=modules',
    };
  }

  return {
    type: 'link',
    label: `${moduleLabel} megnyitása`,
    href: MODULE_ROUTES[moduleId] ?? '/settings?tab=modules',
  };
}

export function productUpdateModuleTier(moduleId: string | null): 'pro' | 'premium' | null {
  if (!moduleId || !isHouseholdModuleId(moduleId)) return null;
  return ONBOARDING_MODULE_TIERS[moduleId] ?? null;
}
