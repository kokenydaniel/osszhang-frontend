export const subscriptionConfig = {
  tiers: {
    free: 'free' as const,
    pro: 'pro' as const,
    premium: 'premium' as const,
  },
  proModules: ['savings', 'debts', 'utilities', 'meters'] as const,
  premiumModules: ['business'] as const,
  proFeatures: ['private_wallet', 'utility_split'] as const,
  premiumFeatures: ['shopify_import', 'ai'] as const,
  tierRank: { free: 0, pro: 1, premium: 2 } as const,
} as const;

export type PremiumFeatureId =
  | (typeof subscriptionConfig.proFeatures)[number]
  | (typeof subscriptionConfig.premiumFeatures)[number];
