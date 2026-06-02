import type { UserProfile, PlatformFeatureFlagKey } from '@/types';

export type { PlatformFeatureFlagKey, PlatformFeatureFlags } from '@/types/auth';

export function isPlatformFeatureEnabled(
  user: UserProfile | null | undefined,
  key: PlatformFeatureFlagKey,
): boolean {
  if (!user) return false;
  if (key === 'maintenance_mode') {
    return Boolean(user.platform_feature_flags?.maintenance_mode);
  }
  if (user.lifetime_admin) return true;
  return Boolean(user.platform_feature_flags?.[key]);
}

/** True when the app is in maintenance and this user must not use the API. */
export function isMaintenanceBlockedForUser(user: UserProfile | null | undefined): boolean {
  if (!user || user.lifetime_admin) return false;
  return isPlatformFeatureEnabled(user, 'maintenance_mode');
}

/** Skip dashboard data loads, session refresh, and toasts for maintenance-only users. */
export function shouldUseMaintenanceOnlySession(user: UserProfile | null | undefined): boolean {
  return isMaintenanceBlockedForUser(user);
}
