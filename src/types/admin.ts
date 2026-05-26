import type { SubscriptionTier } from '@/types';

export interface AdminUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  lifetimeAdmin: boolean;
  isActive: boolean;
  householdId: number | null;
  householdName: string | null;
  effectiveTier: SubscriptionTier;
  lastLoginAt: string | null;
  createdAt: string | null;
}

export interface AdminUsersMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface AdminUsersPage {
  users: AdminUser[];
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

export type SystemAnnouncementType = 'info' | 'warning' | 'danger';

export interface SystemAnnouncement {
  id: number;
  message: string;
  type: SystemAnnouncementType;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateSystemAnnouncementPayload {
  message: string;
  type: SystemAnnouncementType;
}
