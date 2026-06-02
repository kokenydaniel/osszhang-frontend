import type { SubscriptionTier } from '@/types';

export type BillingFeatureTier = 'free' | 'pro' | 'premium';

export interface BillingFeatureRow {
  id: string;
  label: string;
  /** Mit kap a felhasználó, ha feljebb vált (összehasonlítás az ingyenes / alacsonyabb szinthez). */
  upgradeHint: string;
  minTier: BillingFeatureTier;
}

export const BILLING_FEATURE_MATRIX: BillingFeatureRow[] = [
  {
    id: 'shared_wallet',
    label: 'Közös kassza kezelése',
    upgradeHint: 'Ingyenes: egy közös kassza a háztartásnak.',
    minTier: 'free',
  },
  {
    id: 'cashflow',
    label: 'Költségvetés és cashflow',
    upgradeHint: 'Ingyenes: havi költségvetés, kategóriák és kimutatások.',
    minTier: 'free',
  },
  {
    id: 'private_wallets',
    label: 'Korlátlan privát kassza',
    upgradeHint: 'Pro: saját kasszák a közös mellett — külön költségvetés és egyenleg.',
    minTier: 'pro',
  },
  {
    id: 'pro_modules',
    label: 'Megtakarítás, tartozás, rezsi, közműóra',
    upgradeHint: 'Pro: teljes modulok az ingyenes költségvetéshez képest.',
    minTier: 'pro',
  },
  {
    id: 'utility_split',
    label: 'Rezsimegosztás és elszámolás',
    upgradeHint: 'Pro: partnerrel osztott rezsi és havi elszámolás.',
    minTier: 'pro',
  },
  {
    id: 'business',
    label: 'Vállalkozás modul',
    upgradeHint: 'Premium: rendelésnapló és bevétel-követés.',
    minTier: 'premium',
  },
  {
    id: 'shopify',
    label: 'Shopify webshop integráció',
    upgradeHint: 'Premium: rendelések automatikus importja.',
    minTier: 'premium',
  },
  {
    id: 'ai',
    label: 'AI pénzügyi asszisztens',
    upgradeHint: 'Premium: CFO, előrejelzés, kategorizálás, anomáliafigyelés, utazástervező.',
    minTier: 'premium',
  },
];

const TIER_RANK: Record<BillingFeatureTier, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

export function isBillingFeatureUnlocked(userTier: SubscriptionTier, minTier: BillingFeatureTier): boolean {
  const normalized = userTier === 'free' || userTier === 'pro' || userTier === 'premium' ? userTier : 'free';
  return TIER_RANK[normalized] >= TIER_RANK[minTier];
}

export function tierPlanLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case 'premium':
      return 'Premium csomag';
    case 'pro':
      return 'Pro csomag';
    default:
      return 'Ingyenes csomag';
  }
}
