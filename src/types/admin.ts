import type { SubscriptionTier } from './wallet';

export interface AdminUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  lifetime_admin: boolean;
  is_active: boolean;
  household_id: number | null;
  household_name: string | null;
  business_name: string | null;
  household_subscription_tier: SubscriptionTier;
  billing_tier: SubscriptionTier;
  effective_tier: SubscriptionTier;
  tier_grant: SubscriptionTier | null;
  tier_grant_expires_at: string | null;
  tier_grant_is_permanent: boolean;
  tier_grant_note: string | null;
  tier_grant_active: boolean;
  last_login_at: string | null;
  created_at: string | null;
}

export interface AdminTierGrantPayload {
  grant_tier: 'pro' | 'premium' | null;
  permanent: boolean;
  expires_at: string | null;
  note: string | null;
}

export interface AdminUsersMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AdminUsersPage {
  users: AdminUser[];
  meta: AdminUsersMeta;
}

export interface AdminUsersApiResponse {
  data: AdminUser[];
  meta: AdminUsersMeta;
}

export type AdminUserStatusFilter = 'all' | 'active' | 'inactive';
export type AdminLifetimeAdminFilter = 'all' | 'yes' | 'no';

export interface AdminUsersQuery {
  search?: string;
  status?: AdminUserStatusFilter;
  lifetimeAdmin?: AdminLifetimeAdminFilter;
  page?: number;
  perPage?: number;
}

export interface ImpersonateResult {
  accessToken: string;
  user: import('@/types').UserProfile;
  target: AdminUser;
}

export interface FeatureFlag {
  key: string;
  value: boolean;
  description: string | null;
}

export type FeatureFlagsRecord = Record<string, FeatureFlag>;

export interface FeatureFlagsApiResponse {
  data: FeatureFlag[];
}

export type SystemAnnouncementType = 'info' | 'warning' | 'danger';

export interface SystemAnnouncement {
  id: number;
  message: string;
  type: SystemAnnouncementType;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface SystemAnnouncementsApiResponse {
  data: SystemAnnouncement[];
}

export interface CreateSystemAnnouncementPayload {
  message: string;
  type: SystemAnnouncementType;
}
