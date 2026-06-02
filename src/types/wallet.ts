export type SubscriptionTier = 'free' | 'pro' | 'premium';

export type SubscriptionStatus = 'none' | 'active' | 'past_due' | 'canceled' | 'trialing';

export interface WalletProfile {
  id: number;
  household_id: number;
  name: string;
  owner_id: number | null;
  is_shared: boolean;
  manual_balance: number;
}

export type RawApiWallet = WalletProfile;
