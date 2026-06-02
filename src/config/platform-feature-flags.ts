import type { UserProfile, PlatformFeatureFlagKey } from '@/types';

export type { PlatformFeatureFlagKey, PlatformFeatureFlags } from '@/types/auth';

export function isPlatformFeatureEnabled(
  user: UserProfile | null | undefined,
  key: PlatformFeatureFlagKey,
): boolean {
  if (!user) return false;
  if (user.lifetime_admin) return true;
  return Boolean(user.platform_feature_flags?.[key]);
}
