export type SubscriptionTier = 'free' | 'pro' | 'premium';

export type SubscriptionStatus = 'none' | 'active' | 'past_due' | 'canceled' | 'trialing';

export interface WalletProfile {
  id: number;
  householdId: number;
  name: string;
  ownerId: number | null;
  isShared: boolean;
  manualBalance: number;
}

export interface RawApiWallet {
  id: number;
  household_id?: number;
  householdId?: number;
  name: string;
  owner_id?: number | null;
  ownerId?: number | null;
  is_shared?: boolean;
  isShared?: boolean;
  manual_balance?: number;
  manualBalance?: number;
}
