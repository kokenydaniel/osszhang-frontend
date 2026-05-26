import type { SubscriptionTier } from '@/types';
import type { AdminUser, AdminUsersMeta, AdminUsersPage } from '@/types/admin';

export interface RawAdminUser {
  id: number;
  username: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  role: string;
  lifetime_admin?: boolean;
  lifetimeAdmin?: boolean;
  is_active?: boolean;
  isActive?: boolean;
  household_id?: number | null;
  householdId?: number | null;
  household_name?: string | null;
  householdName?: string | null;
  business_name?: string | null;
  businessName?: string | null;
  household_subscription_tier?: SubscriptionTier;
  householdSubscriptionTier?: SubscriptionTier;
  effective_tier?: SubscriptionTier;
  effectiveTier?: SubscriptionTier;
  last_login_at?: string | null;
  lastLoginAt?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
}

export interface RawAdminUsersResponse {
  data: RawAdminUser[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export function mapAdminUserFromApi(raw: RawAdminUser): AdminUser {
  return {
    id: raw.id,
    username: raw.username,
    firstName: raw.firstName ?? raw.first_name ?? '',
    lastName: raw.lastName ?? raw.last_name ?? '',
    role: raw.role,
    lifetimeAdmin: Boolean(raw.lifetimeAdmin ?? raw.lifetime_admin),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
    householdId: raw.householdId ?? raw.household_id ?? null,
    householdName: raw.householdName ?? raw.household_name ?? null,
    businessName: raw.businessName ?? raw.business_name ?? null,
    householdSubscriptionTier: (raw.householdSubscriptionTier ??
      raw.household_subscription_tier ??
      'free') as SubscriptionTier,
    effectiveTier: (raw.effectiveTier ?? raw.effective_tier ?? 'free') as SubscriptionTier,
    lastLoginAt: raw.lastLoginAt ?? raw.last_login_at ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? null,
  };
}

export function mapAdminUsersPageFromApi(raw: RawAdminUsersResponse): AdminUsersPage {
  return {
    users: (raw.data ?? []).map(mapAdminUserFromApi),
    meta: mapAdminUsersMetaFromApi(raw.meta),
  };
}

export function mapAdminUsersMetaFromApi(meta: RawAdminUsersResponse['meta']): AdminUsersMeta {
  return {
    currentPage: meta.current_page,
    lastPage: meta.last_page,
    perPage: meta.per_page,
    total: meta.total,
  };
}
