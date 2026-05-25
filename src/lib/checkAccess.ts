import type { ModuleId } from '@/lib/moduleAccess';
import type { SubscriptionTier, UserProfile } from '@/types';

export const TIER_FREE: SubscriptionTier = 'free';
export const TIER_PRO: SubscriptionTier = 'pro';
export const TIER_PREMIUM: SubscriptionTier = 'premium';

export const PRO_MODULES: ModuleId[] = ['savings', 'debts', 'utilities', 'meters'];
export const PREMIUM_MODULES: ModuleId[] = ['business'];

export type PremiumFeatureId = 'shopify_import' | 'ai' | 'private_wallet' | 'utility_split';

export const PRO_FEATURES: PremiumFeatureId[] = ['private_wallet', 'utility_split'];
export const PREMIUM_FEATURES: PremiumFeatureId[] = ['shopify_import', 'ai'];

export function isBetaMode(user: UserProfile | null | undefined): boolean {
  return Boolean(user?.betaMode);
}

export function effectiveTier(user: UserProfile | null | undefined): SubscriptionTier {
  if (!user) return TIER_FREE;
  if (user.lifetimeAdmin) return TIER_PREMIUM;
  return user.effectiveTier ?? user.household?.subscriptionTier ?? TIER_FREE;
}

export function canAccessModuleByTier(user: UserProfile | null | undefined, moduleId: ModuleId): boolean {
  if (!user) return false;
  if (user.lifetimeAdmin || isBetaMode(user)) return true;

  const tier = effectiveTier(user);

  if (moduleId === 'budget') return true;

  if (PRO_MODULES.includes(moduleId)) {
    return tier === TIER_PRO || tier === TIER_PREMIUM;
  }

  if (PREMIUM_MODULES.includes(moduleId)) {
    return tier === TIER_PREMIUM;
  }

  return false;
}

export function canUseFeature(user: UserProfile | null | undefined, featureId: PremiumFeatureId): boolean {
  if (!user) return false;
  if (user.lifetimeAdmin || isBetaMode(user)) return true;

  const tier = effectiveTier(user);

  if (PRO_FEATURES.includes(featureId)) {
    return tier === TIER_PRO || tier === TIER_PREMIUM;
  }

  if (PREMIUM_FEATURES.includes(featureId)) {
    return tier === TIER_PREMIUM;
  }

  return false;
}

export function canCreatePrivateWallet(user: UserProfile | null | undefined): boolean {
  return canUseFeature(user, 'private_wallet');
}

export function requiredTierForModule(moduleId: ModuleId): SubscriptionTier | null {
  if (moduleId === 'budget') return null;
  if (PREMIUM_MODULES.includes(moduleId)) return TIER_PREMIUM;
  if (PRO_MODULES.includes(moduleId)) return TIER_PRO;
  return null;
}

export function requiredTierForFeature(featureId: PremiumFeatureId): SubscriptionTier {
  if (PREMIUM_FEATURES.includes(featureId)) return TIER_PREMIUM;
  return TIER_PRO;
}

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

function userTierMeetsRequired(userTier: SubscriptionTier, required: SubscriptionTier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[required];
}

export function showTierBadgeForModule(
  user: UserProfile | null | undefined,
  moduleId: ModuleId,
): SubscriptionTier | null {
  if (!user || moduleId === 'budget') return null;

  const required = requiredTierForModule(moduleId);
  if (!required) return null;

  const tier = effectiveTier(user);
  if (userTierMeetsRequired(tier, required)) return null;

  return required;
}

export function requiresUpgradeForModule(
  user: UserProfile | null | undefined,
  moduleId: ModuleId,
): SubscriptionTier | null {
  if (!user || isBetaMode(user)) return null;
  if (canAccessModuleByTier(user, moduleId)) return null;
  return requiredTierForModule(moduleId);
}

export function tierLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case TIER_PRO:
      return 'Pro';
    case TIER_PREMIUM:
      return 'Premium';
    default:
      return 'Free';
  }
}
