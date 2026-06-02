export const STRIPE_PRICE_IDS = {
  proMonthly: 'price_1Tb0mQ4JTKO17UMN7W7qMq5v',
  proYearly: 'price_1Tb0qn4JTKO17UMNZGf86Qeg',
  premiumMonthly: 'price_1Tb0p34JTKO17UMNbxqQPZv0',
  premiumYearly: 'price_1Tb0rN4JTKO17UMNcKBgy6S8',
} as const;

export type StripePriceKey = keyof typeof STRIPE_PRICE_IDS;

export function priceIdForTier(tier: 'pro' | 'premium', interval: 'monthly' | 'yearly' = 'monthly'): string {
  if (tier === 'premium') {
    return interval === 'yearly' ? STRIPE_PRICE_IDS.premiumYearly : STRIPE_PRICE_IDS.premiumMonthly;
  }

  return interval === 'yearly' ? STRIPE_PRICE_IDS.proYearly : STRIPE_PRICE_IDS.proMonthly;
}
