import type { RawApiHousehold } from './household';
import type { RawApiWallet, SubscriptionTier, WalletProfile } from './wallet';

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
  wallets?: RawApiWallet[];
  household?: RawApiHousehold;
}
