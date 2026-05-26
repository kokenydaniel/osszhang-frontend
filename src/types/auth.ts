import type { RawApiHousehold } from './household';
import type { RawApiWallet, SubscriptionTier, WalletProfile } from './wallet';
import type { SystemAnnouncement } from './admin';

export type PlatformFeatureFlagKey = 'enable_ai_cfo' | 'enable_ai_travel_planner';
export type PlatformFeatureFlags = Partial<Record<PlatformFeatureFlagKey, boolean>>;

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  mustChangePassword?: boolean;
  role: 'admin' | 'editor' | 'reader';
  permissions?: string[];
  lifetimeAdmin?: boolean;
  betaMode?: boolean;
  effectiveTier?: SubscriptionTier;
  platformFeatureFlags?: PlatformFeatureFlags;
  systemAnnouncement?: SystemAnnouncement | null;
  wallets?: WalletProfile[];
  household?: import('./household').HouseholdProfile;
}

export interface RawApiUser {
  id: number;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  username?: string;
  must_change_password?: boolean;
  role?: string;
  permissions?: string[];
  lifetime_admin?: boolean;
  lifetimeAdmin?: boolean;
  beta_mode?: boolean;
  betaMode?: boolean;
  effective_tier?: SubscriptionTier;
  effectiveTier?: SubscriptionTier;
  platform_feature_flags?: PlatformFeatureFlags;
  platformFeatureFlags?: PlatformFeatureFlags;
  system_announcement?: import('./admin').SystemAnnouncement | null;
  systemAnnouncement?: import('./admin').SystemAnnouncement | null;
  wallets?: RawApiWallet[];
  household?: RawApiHousehold;
}
