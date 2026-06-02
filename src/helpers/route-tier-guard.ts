import {
  tierGuardedFeatureRoutes,
  tierGuardedModuleRoutes,
} from '@/config/route-access';
import type { ModuleId } from '@/helpers/module-access';
import {
  requiresUpgradeForFeature,
  requiresUpgradeForModule,
} from '@/helpers/check-access';
import type { PremiumFeatureId } from '@/config/subscription';
import type { SubscriptionTier, UserProfile } from '@/types';

export type RouteTierUpgradeRequirement = {
  requiredTier: SubscriptionTier;
  featureLabel?: string;
  moduleId?: ModuleId;
  featureId?: PremiumFeatureId;
};

export function resolveRouteTierUpgradeRequirement(
  user: UserProfile | null | undefined,
  pathname: string,
): RouteTierUpgradeRequirement | null {
  if (!user) return null;

  for (const { prefix, moduleId } of tierGuardedModuleRoutes) {
    if (!pathname.startsWith(prefix)) continue;
    const requiredTier = requiresUpgradeForModule(user, moduleId);
    if (requiredTier) {
      return { requiredTier, moduleId };
    }
  }

  for (const { prefix, featureId, featureLabel } of tierGuardedFeatureRoutes) {
    if (!pathname.startsWith(prefix)) continue;
    const requiredTier = requiresUpgradeForFeature(user, featureId);
    if (requiredTier) {
      return { requiredTier, featureLabel, featureId };
    }
  }

  return null;
}
