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
    upgradeHint: 'Premium: Shopify rendelések automatikus importja.',
    minTier: 'premium',
  },
  {
    id: 'woocommerce',
    label: 'WooCommerce webshop integráció',
    upgradeHint: 'Premium: WooCommerce rendelések importja.',
    minTier: 'premium',
  },
  {
    id: 'unas',
    label: 'UNAS webshop integráció',
    upgradeHint: 'Premium: UNAS rendelések importja.',
    minTier: 'premium',
  },
  {
    id: 'ai',
    label: 'Okos pénzügyi funkciók',
    upgradeHint: 'Premium: tanácsadó, fizetési prioritás, ÁFA kimutatás, spórolási javaslatok.',
    minTier: 'premium',
  },
  {
    id: 'integrations',
    label: 'Webshop integrációk (Shopify, WooCommerce, UNAS)',
    upgradeHint: 'Premium: három webshop platform rendelés importja.',
    minTier: 'premium',
  },
  {
    id: 'attachments',
    label: 'Számla és nyugta csatolás',
    upgradeHint: 'Premium: fájl csatolása tételekhez.',
    minTier: 'premium',
  },
  {
    id: 'sumup_import',
    label: 'SumUp könyvelési import',
    upgradeHint: 'Premium: SumUp tranzakciók és kifizetések automatikus letöltése a könyvelési csomagba.',
    minTier: 'premium',
  },
  {
    id: 'pocket_money',
    label: 'Családi zsebpénz',
    upgradeHint: 'Pro: gyerekek zsebpénze és költései.',
    minTier: 'pro',
  },
  {
    id: 'insurance',
    label: 'Biztosítások',
    upgradeHint: 'Pro: szerződések és megújítási emlékeztetők.',
    minTier: 'pro',
  },
  {
    id: 'rental',
    label: 'Bérbeadás',
    upgradeHint: 'Pro: bérleti ingatlanok és bevételek.',
    minTier: 'pro',
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
