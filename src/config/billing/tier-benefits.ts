import type { ModuleId } from '@/config/config';
import type { PremiumFeatureId } from '@/config/subscription';
import type { SubscriptionTier } from '@/types';

export type PaidTier = 'pro' | 'premium';

/** Ingyenes csomag — összehasonlítási alap. */
export const FREE_TIER_BULLETS: readonly string[] = [
  '1 közös kassza',
  'Költségvetés és cashflow',
  'Háztartás és tagok kezelése',
];

/** Pro: az ingyeneshez képest. */
export const PRO_TIER_BULLETS: readonly string[] = [
  'Korlátlan privát kassza (az ingyenes 1 közös kasszához képest)',
  'Megtakarítás modul — célok, számlák, állampapírok',
  'Tartozások és hátralékos számlák nyomon követése',
  'Rezsi és közműóra modulok',
  'Rezsimegosztás és havi elszámolás partnerrel',
];

/** Premium: az ingyeneshez képest (teljes lista). */
export const PREMIUM_TIER_BULLETS: readonly string[] = [
  'Minden Pro funkció (privát kasszák, megtakarítás, tartozás, rezsi, órák)',
  'Vállalkozás modul — rendelések és bevételek',
  'Shopify webshop import és szinkron',
  'AI pénzügyi tanácsadó — CFO, előrejelzés, anomáliafigyelés',
  'Automatikus tranzakció-kategorizálás',
  'AI utazástervező és mentés megtakarítási célként',
];

/** Premium: Pro felhasználónak — csak a ráadás. */
export const PREMIUM_ONLY_BULLETS: readonly string[] = [
  'Vállalkozás modul — rendelések és bevételek',
  'Shopify webshop import és szinkron',
  'AI pénzügyi tanácsadó — CFO, előrejelzés, anomáliafigyelés',
  'Automatikus tranzakció-kategorizálás',
  'AI utazástervező és mentés megtakarítási célként',
];

const FEATURE_UPGRADE_CONTEXT: Record<PremiumFeatureId, string> = {
  private_wallet:
    'A Pro-val korlátlan privát kasszát hozhatsz létre a közös kassza mellett — saját költségvetés, megtakarítás és tartozás külön.',
  utility_split:
    'A Pro-val beállíthatod, ki melyik rezsi tételt viseli, és havi elszámolást rögzíthetsz a partnereddel.',
  shopify_import:
    'A Premium-mal a Shopify rendeléseid automatikusan bekerülnek a vállalkozás modulba.',
  ai: 'A Premium-mal AI elemzéseket, előrejelzést, automatikus kategorizálást és utazástervezést kapsz.',
};

const MODULE_UPGRADE_CONTEXT: Partial<Record<ModuleId, string>> = {
  savings: 'A Pro-val megtakarítási célokat, számlákat és állampapír portfóliót kezelhetsz.',
  debts: 'A Pro-val tartozásokat, részleteket és visszafizetési tervet követhetsz.',
  utilities: 'A Pro-val rezsi tételeket, határidőket és kifizetéseket rögzíthetsz.',
  meters: 'A Pro-val közműóra állásokat és fogyasztást követhetsz.',
  business: 'A Premium-mal a vállalkozás modult és a rendelésnaplót használhatod.',
};

export function tierBenefitBullets(
  tier: PaidTier,
  options?: { currentTier?: SubscriptionTier | null },
): string[] {
  if (tier === 'pro') {
    return [...PRO_TIER_BULLETS];
  }
  if (options?.currentTier === 'pro') {
    return ['Minden Pro funkció továbbra is benne van', ...PREMIUM_ONLY_BULLETS];
  }
  return [...PREMIUM_TIER_BULLETS];
}

export function tierUpgradeIntro(tier: PaidTier, currentTier?: SubscriptionTier | null): string {
  if (tier === 'pro') {
    return 'Az ingyenes csomaghoz képest a Pro-val ezeket kapod:';
  }
  if (currentTier === 'pro') {
    return 'A Pro csomagodhoz képest a Premium-mal ezeket kapod ráadásul:';
  }
  return 'Az ingyenes csomaghoz képest a Premium-mal mindezeket kapod:';
}

export function upgradeModalDescription(
  tier: PaidTier,
  options?: {
    featureLabel?: string | null;
    currentTier?: SubscriptionTier | null;
    featureId?: PremiumFeatureId;
    moduleId?: ModuleId;
  },
): string {
  const tierName = tier === 'premium' ? 'Premium' : 'Pro';
  const parts: string[] = [];

  if (options?.featureLabel) {
    parts.push(`A(z) „${options.featureLabel}” funkció a ${tierName} csomagban érhető el.`);
  }

  const context =
    (options?.featureId && FEATURE_UPGRADE_CONTEXT[options.featureId]) ||
    (options?.moduleId && MODULE_UPGRADE_CONTEXT[options.moduleId]) ||
    null;
  if (context) {
    parts.push(context);
  }

  parts.push(tierUpgradeIntro(tier, options?.currentTier));

  return parts.join(' ');
}

export function tierGatedPanelMessage(tier: PaidTier, featureLabel: string, currentTier?: SubscriptionTier | null): string {
  const tierName = tier === 'premium' ? 'Premium' : 'Pro';
  const intro =
    tier === 'premium' && currentTier === 'pro'
      ? 'A Pro csomagodhoz képest a Premium-mal AI és vállalkozás funkciókat kapsz.'
      : tier === 'premium'
        ? 'Az ingyenes vagy Pro csomaghoz képest a Premium-mal AI elemzéseket, Shopify importot és vállalkozás modult kapsz.'
        : 'Az ingyenes csomaghoz képest a Pro-val privát kasszákat, megtakarítást, tartozást és rezsi modulokat kapsz.';

  return `A(z) „${featureLabel}” a ${tierName} csomag része. ${intro}`;
}

export function featureUpgradeContext(featureId: PremiumFeatureId): string {
  return FEATURE_UPGRADE_CONTEXT[featureId];
}

export function moduleUpgradeContext(moduleId: ModuleId): string | undefined {
  return MODULE_UPGRADE_CONTEXT[moduleId] ?? undefined;
}
