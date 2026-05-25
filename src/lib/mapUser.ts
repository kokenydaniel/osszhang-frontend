import { mapHouseholdFromApi } from '@/lib/mapHousehold';
import { mapWalletFromApi } from '@/lib/mapWallet';
import type { RawApiUser, SubscriptionTier, UserProfile } from '@/types';

export function mapUserFromApi(u: RawApiUser): UserProfile {
  const effectiveTier = (u.effectiveTier ?? u.effective_tier ?? 'free') as SubscriptionTier;

  return {
    id: u.id,
    firstName: u.first_name || u.firstName || '',
    lastName: u.last_name || u.lastName || '',
    username: u.username || '',
    mustChangePassword: Boolean(u.must_change_password),
    role: u.role === 'admin' || u.role === 'editor' || u.role === 'reader' ? u.role : 'editor',
    permissions: u.permissions || ['budget', 'utilities', 'business', 'meters', 'debts', 'savings'],
    lifetimeAdmin: Boolean(u.lifetimeAdmin ?? u.lifetime_admin),
    betaMode: Boolean(u.betaMode ?? u.beta_mode),
    effectiveTier,
    wallets: u.wallets?.map(mapWalletFromApi) ?? [],
    household: u.household ? mapHouseholdFromApi(u.household) : undefined,
  };
}
