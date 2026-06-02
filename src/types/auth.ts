import type { RawApiHousehold } from './household';
import type { RawApiWallet, SubscriptionTier } from './wallet';
import type { SystemAnnouncement } from './admin';

export type PlatformFeatureFlagKey = 'enable_ai_cfo' | 'enable_ai_travel_planner';
export type PlatformFeatureFlags = Partial<Record<PlatformFeatureFlagKey, boolean>>;

export interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  must_change_password?: boolean;
  role: 'admin' | 'editor' | 'reader';
  permissions?: string[];
  lifetime_admin?: boolean;
  beta_mode?: boolean;
  effective_tier?: SubscriptionTier;
  billing_tier?: SubscriptionTier;
  platform_feature_flags?: PlatformFeatureFlags;
  system_announcement?: SystemAnnouncement | null;
  wallets?: RawApiWallet[];
  household?: RawApiHousehold;
}

export type RawApiUser = UserProfile;
