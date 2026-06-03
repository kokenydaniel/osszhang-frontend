import type { FeatureFlag, SystemAnnouncementType } from '@/types/admin';

import { aiFeatureLabel } from '@/config/ai-features';
import {
  PLATFORM_FEATURE_META,
  platformFeatureCategory,
  platformFeatureLabel,
  type PlatformFeatureCategory,
} from '@/config/platform-features';

export function formatFeatureFlagLabel(key: string): string {
  return platformFeatureLabel(key);
}

/** @deprecated use formatFeatureFlagLabel */
export function formatFeatureFlagLabelLegacy(key: string): string {
  switch (key) {
    case 'enable_ai_cfo':
      return aiFeatureLabel('monthly_advisor');
    case 'enable_ai_travel_planner':
      return aiFeatureLabel('travel_planner');
    case 'beta_mode':
      return 'Béta üzemmód';
    default:
      return platformFeatureLabel(key);
  }
}

export function formatAnnouncementTypeLabel(type: SystemAnnouncementType): string {
  switch (type) {
    case 'info':
      return 'Információ';
    case 'warning':
      return 'Figyelmeztetés';
    case 'danger':
      return 'Veszély / Sürgős';
    default:
      return type;
  }
}

export function featureFlagsToRecord(flags: FeatureFlag[]): Record<string, FeatureFlag> {
  const record: Record<string, FeatureFlag> = {};
  for (const flag of flags) {
    record[flag.key] = flag;
  }
  return record;
}

function normalizeCategories(
  categories?: PlatformFeatureCategory | PlatformFeatureCategory[],
): PlatformFeatureCategory[] | undefined {
  if (!categories) return undefined;
  return Array.isArray(categories) ? categories : [categories];
}

/** API-ból jövő flag-eket kiegészíti a katalógussal, hogy üres szűrő ne legyen migráció előtt sem. */
export function mergeFeatureFlagsWithCatalog(
  flags: FeatureFlag[],
  categories?: PlatformFeatureCategory | PlatformFeatureCategory[],
): FeatureFlag[] {
  const categoryList = normalizeCategories(categories);
  const byKey = featureFlagsToRecord(flags);

  const keys = categoryList
    ? Object.entries(PLATFORM_FEATURE_META)
        .filter(([, meta]) => categoryList.includes(meta.category))
        .map(([key]) => key)
    : Object.keys(byKey);

  const mergedKeys = [...new Set([...keys, ...Object.keys(byKey)])].filter((key) => {
    if (!categoryList) return true;
    return categoryList.includes(platformFeatureCategory(key));
  });

  return mergedKeys.sort().map((key) => {
    const existing = byKey[key];
    const meta = PLATFORM_FEATURE_META[key];
    const description =
      meta?.description ??
      existing?.description ??
      'Még nincs az adatbázisban — futtasd a migrációt a szerveren.';

    return {
      key,
      value: existing?.value ?? false,
      description,
    };
  });
}

export function formatTierLabel(tier: string | undefined): string {
  switch (tier) {
    case 'premium':
      return 'Premium';
    case 'pro':
      return 'Pro';
    default:
      return 'Ingyenes';
  }
}

export function formatHouseholdRole(role: string): string {
  switch (role) {
    case 'admin':
      return 'Háztartás admin';
    case 'editor':
      return 'Szerkesztő';
    case 'viewer':
      return 'Olvasó';
    default:
      return role;
  }
}
