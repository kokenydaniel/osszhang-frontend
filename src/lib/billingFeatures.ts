import type { SubscriptionTier } from '@/types';

export type BillingFeatureTier = 'free' | 'pro' | 'premium';

export interface BillingFeatureRow {
  id: string;
  label: string;
  minTier: BillingFeatureTier;
}

export const BILLING_FEATURE_MATRIX: BillingFeatureRow[] = [
  { id: 'shared_wallet', label: 'Közös kassza kezelése', minTier: 'free' },
  { id: 'cashflow', label: 'Alapszintű cashflow grafikonok', minTier: 'free' },
  { id: 'private_wallets', label: 'Korlátlan privát kassza', minTier: 'pro' },
  { id: 'pro_modules', label: 'Rezsimegosztás és tartozások', minTier: 'pro' },
  { id: 'ai', label: 'AI pénzügyi asszisztens és előrejelzés', minTier: 'premium' },
  { id: 'shopify', label: 'Shopify webshop integráció', minTier: 'premium' },
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
