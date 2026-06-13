import type { FeatureFlag, SystemAnnouncementType, AdminHousehold, AdminHouseholdAiUsagePricing } from '@/types/admin';
import type { SubscriptionTier } from '@/types/wallet';
import { formatDate } from '@/utils';
import { formatDisplayName } from '@/utils/person-name';

import { aiFeatureLabel } from '@/config/ai-features';
import {
  PLATFORM_FEATURE_META,
  platformFeatureCategory,
  platformFeatureLabel,
  type PlatformFeatureCategory,
} from '@/config/platform-features';
import {
  PLATFORM_MODULE_IDS,
  PLATFORM_MODULE_META,
  platformModuleFlagKey,
} from '@/config/platform-modules';
import type { ModuleId } from '@/config/config';

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
    if (key.startsWith('enable_module_')) return false;
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

export function formatModuleReleaseFlagLabel(key: string): string {
  const moduleId = key.replace(/^enable_module_/, '') as ModuleId;
  return PLATFORM_MODULE_META[moduleId]?.label ?? key.replace(/^enable_module_/, ' ');
}

/** Modul kiadás flag-ek — katalógussal, migráció előtt is teljes lista. */
export function mergeModuleReleaseFlagsWithCatalog(flags: FeatureFlag[]): FeatureFlag[] {
  const byKey = featureFlagsToRecord(flags);

  return PLATFORM_MODULE_IDS.map((moduleId) => {
    const key = platformModuleFlagKey(moduleId);
    const existing = byKey[key];
    const meta = PLATFORM_MODULE_META[moduleId];

    return {
      key,
      value: moduleId === 'budget' ? true : (existing?.value ?? false),
      description:
        meta?.description ??
        existing?.description ??
        'Még nincs az adatbázisban — futtasd a migrációt a szerveren.',
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

export function formatSubscriptionStatus(status: string | undefined): string {
  switch (status) {
    case 'active':
      return 'Aktív előfizetés';
    case 'trialing':
      return 'Próbaidő';
    case 'past_due':
      return 'Lejárt fizetés';
    case 'canceled':
      return 'Lemondva';
    case 'none':
    default:
      return 'Nincs Stripe előfizetés';
  }
}

export const ADMIN_MODULE_LABELS: Record<string, string> = {
  budget: 'Költségvetés',
  savings: 'Megtakarítás',
  debts: 'Tartozások',
  utilities: 'Rezsi',
  meters: 'Közműórák',
  business: 'Vállalkozás',
  pocket_money: 'Zsebpénz',
  insurance: 'Biztosítások',
  rental: 'Bérbeadás',
  receivables: 'Kintlévőség',
  travel_planner: 'Utazástervező',
  utility_split: 'Rezsi megosztás',
};

export function formatHouseholdRole(role: string): string {
  switch (role) {
    case 'admin':
      return 'Háztartás admin';
    case 'editor':
      return 'Szerkesztő';
    case 'reader':
    case 'viewer':
      return 'Olvasó';
    default:
      return role;
  }
}

export type HouseholdAccessSummary = {
  effectiveTier: SubscriptionTier;
  billingTier: SubscriptionTier;
  grantTier: SubscriptionTier | null;
  grantActive: boolean;
  grantBoostsAccess: boolean;
  headline: string;
  subline: string;
  stripeLabel: string;
  grantLabel: string;
  grantExpiryLabel: string | null;
};

export function describeHouseholdAccess(
  household: Pick<
    AdminHousehold,
    | 'billing_tier'
    | 'access_tier'
    | 'subscription_status'
    | 'tier_grant'
    | 'tier_grant_active'
    | 'tier_grant_expires_at'
    | 'tier_grant_is_permanent'
    | 'tier_grant_note'
  >,
): HouseholdAccessSummary {
  const billingTier = household.billing_tier ?? 'free';
  const effectiveTier = household.access_tier ?? billingTier;
  const grantActive = Boolean(household.tier_grant_active && household.tier_grant);
  const grantTier = grantActive ? (household.tier_grant as SubscriptionTier) : null;
  const grantBoostsAccess = grantActive && billingTier !== effectiveTier;

  const stripeLabel = `${formatTierLabel(billingTier)} · ${formatSubscriptionStatus(household.subscription_status)}`;

  let grantLabel = 'Nincs admin ajándék hozzáférés';
  let grantExpiryLabel: string | null = null;
  if (grantActive && grantTier) {
    grantLabel = formatTierLabel(grantTier);
    grantExpiryLabel = household.tier_grant_is_permanent
      ? 'Örökös'
      : household.tier_grant_expires_at
        ? `Lejár: ${formatDate(household.tier_grant_expires_at)}`
        : null;
  }

  let headline = `${formatTierLabel(effectiveTier)} hozzáférés`;
  let subline = 'A háztartás tagjai ezt a csomagszintet használják az appban.';

  if (grantBoostsAccess && grantTier) {
    subline = `Stripe szerint ${formatTierLabel(billingTier).toLowerCase()} csomagjuk van, de admin ajándékkal ${formatTierLabel(grantTier).toLowerCase()} funkciókat kapnak.`;
  } else if (grantActive && grantTier && billingTier === effectiveTier) {
    subline = `Fizetős csomag és admin ajándék egyaránt ${formatTierLabel(effectiveTier).toLowerCase()}.`;
  } else if (billingTier === effectiveTier && billingTier !== 'free') {
    subline = `Stripe előfizetés alapján ${formatTierLabel(billingTier).toLowerCase()} csomag.`;
  } else if (effectiveTier === 'free') {
    subline = 'Ingyenes csomag — nincs fizetős előfizetés és nincs aktív admin ajándék.';
  }

  return {
    effectiveTier,
    billingTier,
    grantTier,
    grantActive,
    grantBoostsAccess,
    headline,
    subline,
    stripeLabel,
    grantLabel,
    grantExpiryLabel,
  };
}

export function householdGrantBlockedReason(household: AdminHousehold): string | null {
  const lifetimeAdmin = household.members?.find((member) => member.lifetime_admin);
  if (!lifetimeAdmin) return null;

  const label =
    formatDisplayName(lifetimeAdmin.first_name, lifetimeAdmin.last_name) || lifetimeAdmin.username;

  return `A háztartás lifetime admin tagja (${label}) miatt nem adható grant.`;
}

export const ADMIN_INTEGRATION_LABELS: Record<string, string> = {
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  unas: 'UNAS',
  sumup: 'SumUp',
};

export const ADMIN_AI_FEATURE_LABELS: Record<string, string> = {
  auto_categorize: 'Kategória javaslat',
  overspend_analysis: 'Túlköltés elemzés',
  monthly_advisor: 'Havi tanácsadó',
  travel_planner: 'Utazástervező',
  ai_query: 'AI kérdés',
  cost_reduction: 'Spórolási javaslat',
};

export function formatTokenCount(value: number): string {
  return new Intl.NumberFormat('hu-HU').format(Math.max(0, value));
}

export function formatAiCostUsd(usd: number): string {
  const value = Math.max(0, usd);
  if (value === 0) return '$0';
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(2)}`;
}

export function formatAiCostDisplay(usd: number, usdToHufRate?: number | null): string {
  const usdLabel = formatAiCostUsd(usd);
  if (usdToHufRate == null || usdToHufRate <= 0 || usd <= 0) return usdLabel;

  const huf = Math.round(usd * usdToHufRate);
  return `${usdLabel} (≈ ${new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(huf)})`;
}

export function describeOpenAiPricingSource(pricing: AdminHouseholdAiUsagePricing | undefined): string {
  if (!pricing?.default_model_rates) {
    return 'A költség minden AI hívásnál rögzített USD összeg az OpenAI Standard tier árai alapján.';
  }

  const rates = pricing.default_model_rates;
  const input = formatAiCostUsd(rates.input_per_million);
  const output = formatAiCostUsd(rates.output_per_million);
  const cached = rates.cached_per_million != null ? formatAiCostUsd(rates.cached_per_million) : null;
  const verified = pricing.last_verified ? ` (${pricing.last_verified})` : '';

  return [
    `OpenAI Standard tier${verified}: ${rates.model} — ${input} / 1M input, ${output} / 1M output`,
    cached ? `${cached} / 1M cached input` : null,
    `Forrás: ${pricing.source_url}`,
  ]
    .filter(Boolean)
    .join(' · ');
}
