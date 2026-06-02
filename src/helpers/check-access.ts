import config from '@/config/config';
import type { ModuleId } from '@/helpers/module-access';
import type { SubscriptionTier, UserProfile } from '@/types';

const { subscription: sub } = config;

/** @deprecated Use `config.subscription.tiers.free` */
export const TIER_FREE = sub.tiers.free;
/** @deprecated Use `config.subscription.tiers.pro` */
export const TIER_PRO = sub.tiers.pro;
/** @deprecated Use `config.subscription.tiers.premium` */
export const TIER_PREMIUM = sub.tiers.premium;

export const PRO_MODULES: ModuleId[] = [...sub.proModules];
export const PREMIUM_MODULES: ModuleId[] = [...sub.premiumModules];

import type { PremiumFeatureId } from '@/config/subscription';

export type { PremiumFeatureId };

export const PRO_FEATURES = [...sub.proFeatures];
export const PREMIUM_FEATURES = [...sub.premiumFeatures];

export function isBetaMode(user: UserProfile | null | undefined): boolean {
  return Boolean(user?.beta_mode);
}

export function effectiveTier(user: UserProfile | null | undefined): SubscriptionTier {
  if (!user) return sub.tiers.free;
  if (user.lifetime_admin) return sub.tiers.premium;
  return user.effective_tier ?? user.household?.subscription_tier ?? sub.tiers.free;
}

export function canAccessModuleByTier(user: UserProfile | null | undefined, moduleId: ModuleId): boolean {
  if (!user) return false;
  if (user.lifetime_admin || isBetaMode(user)) return true;

  const tier = effectiveTier(user);

  if (moduleId === 'budget') return true;

  if ((sub.proModules as readonly string[]).includes(moduleId)) {
    return tier === sub.tiers.pro || tier === sub.tiers.premium;
  }

  if ((sub.premiumModules as readonly string[]).includes(moduleId)) {
    return tier === sub.tiers.premium;
  }

  return false;
}

export function canUseFeature(user: UserProfile | null | undefined, featureId: PremiumFeatureId): boolean {
  if (!user) return false;
  if (user.lifetime_admin || isBetaMode(user)) return true;

  const tier = effectiveTier(user);

  if ((sub.proFeatures as readonly string[]).includes(featureId)) {
    return tier === sub.tiers.pro || tier === sub.tiers.premium;
  }

  if ((sub.premiumFeatures as readonly string[]).includes(featureId)) {
    return tier === sub.tiers.premium;
  }

  return false;
}

export function canCreatePrivateWallet(user: UserProfile | null | undefined): boolean {
  return canUseFeature(user, 'private_wallet');
}

export function requiredTierForModule(moduleId: ModuleId): SubscriptionTier | null {
  if (moduleId === 'budget') return null;
  if ((sub.premiumModules as readonly string[]).includes(moduleId)) return sub.tiers.premium;
  if ((sub.proModules as readonly string[]).includes(moduleId)) return sub.tiers.pro;
  return null;
}

export function requiredTierForFeature(featureId: PremiumFeatureId): SubscriptionTier {
  if ((sub.premiumFeatures as readonly string[]).includes(featureId)) return sub.tiers.premium;
  return sub.tiers.pro;
}

function userTierMeetsRequired(userTier: SubscriptionTier, required: SubscriptionTier): boolean {
  return sub.tierRank[userTier] >= sub.tierRank[required];
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

export function requiresUpgradeForFeature(
  user: UserProfile | null | undefined,
  featureId: PremiumFeatureId,
): SubscriptionTier | null {
  if (!user || isBetaMode(user)) return null;
  if (canUseFeature(user, featureId)) return null;
  return requiredTierForFeature(featureId);
}

export function tierLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case sub.tiers.pro:
      return 'Pro';
    case sub.tiers.premium:
      return 'Premium';
    default:
      return 'Free';
  }
}
