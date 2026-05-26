import { mapHouseholdFromApi } from '@/lib/mapHousehold';
import { mapWalletFromApi } from '@/lib/mapWallet';
import { mapSystemAnnouncementFromApi, type RawSystemAnnouncement } from '@/mappers/announcements.mapper';
import type { RawApiUser, SubscriptionTier, UserProfile } from '@/types';

export function mapUserFromApi(u: RawApiUser): UserProfile {
  const effectiveTier = (u.effectiveTier ?? u.effective_tier ?? 'free') as SubscriptionTier;
  const platformFeatureFlags = u.platformFeatureFlags ?? u.platform_feature_flags;

  const rawAnnouncement = u.systemAnnouncement ?? u.system_announcement;
  const systemAnnouncement =
    rawAnnouncement && typeof rawAnnouncement === 'object'
      ? mapSystemAnnouncementFromApi(rawAnnouncement as RawSystemAnnouncement)
      : null;

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
    platformFeatureFlags: platformFeatureFlags ?? undefined,
    systemAnnouncement: systemAnnouncement?.isActive ? systemAnnouncement : null,
    wallets: u.wallets?.map(mapWalletFromApi) ?? [],
    household: u.household ? mapHouseholdFromApi(u.household) : undefined,
  };
}
