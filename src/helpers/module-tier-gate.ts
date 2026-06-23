import type { ModuleId } from '@/helpers/module-access';
import { MODULE_LABELS } from '@/helpers/module-access';
import {
  canAccessModuleByTier,
  canUseFeature,
  requiredTierForFeature,
  requiredTierForModule,
  toUpgradeTier,
  type PremiumFeatureId,
} from '@/helpers/check-access';
import type { UserProfile } from '@/types';
import { openUpgradeModal } from '@/stores/useUpgradeModalStore';

export function blockModuleEnable(
  user: UserProfile | null | undefined,
  moduleId: ModuleId,
  enabling: boolean,
): boolean {
  if (!enabling || canAccessModuleByTier(user, moduleId)) {
    return false;
  }

  const requiredTier = requiredTierForModule(moduleId);
  if (requiredTier) {
    openUpgradeModal({
      requiredTier: toUpgradeTier(requiredTier),
      featureLabel: MODULE_LABELS[moduleId],
      moduleId,
    });
  }

  return true;
}

export function blockFeatureEnable(
  user: UserProfile | null | undefined,
  featureId: PremiumFeatureId,
  enabling: boolean,
  featureLabel: string,
): boolean {
  if (!enabling || canUseFeature(user, featureId)) {
    return false;
  }

  openUpgradeModal({
    requiredTier: toUpgradeTier(requiredTierForFeature(featureId)),
    featureLabel,
    featureId,
  });

  return true;
}

export function moduleEnableAllowed(user: UserProfile | null | undefined, moduleId: ModuleId): boolean {
  return canAccessModuleByTier(user, moduleId);
}

export function featureEnableAllowed(user: UserProfile | null | undefined, featureId: PremiumFeatureId): boolean {
  return canUseFeature(user, featureId);
}
