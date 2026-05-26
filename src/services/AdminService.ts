import type { AdminUser, AdminUsersPage, AdminUsersQuery, FeatureFlag, ImpersonateResult, CreateSystemAnnouncementPayload, SystemAnnouncement } from '@/types/admin';
import { adminClient } from '@/lib/api-client';
import {
  mapAdminUserFromApi,
  mapAdminUsersPageFromApi,
  type RawAdminUser,
} from '@/mappers/admin.mapper';
import {
  featureFlagsToRecord,
  mapFeatureFlagFromApi,
  mapFeatureFlagsFromApi,
  type RawFeatureFlag,
} from '@/mappers/featureFlags.mapper';
import { mapUserFromApi } from '@/lib/mapUser';
import {
  mapSystemAnnouncementFromApi,
  mapSystemAnnouncementsFromApi,
  type RawSystemAnnouncement,
} from '@/mappers/announcements.mapper';
import { unwrapApiData } from '@/lib/unwrapApiData';
import { isAbortError } from '@/lib/api-client/abortError';

class AdminService {
  private static _instance: AdminService | null = null;
  private abortController: AbortController | null = null;

  private constructor() {}

  static getInstance(): AdminService {
    if (!AdminService._instance) {
      AdminService._instance = new AdminService();
    }
    return AdminService._instance;
  }

  async fetchUsers(query?: AdminUsersQuery): Promise<AdminUsersPage> {
    this.abortController?.abort();
    this.abortController = new AbortController();

    try {
      const res = await adminClient.listUsers(query, {
        signal: this.abortController.signal,
        silent: true,
      });
      return mapAdminUsersPageFromApi(res.data);
    } catch (error) {
      if (isAbortError(error)) throw error;
      console.error('[AdminService] fetchUsers failed', error);
      throw error;
    }
  }

  async activateUser(userId: number): Promise<AdminUser> {
    const res = await adminClient.activateUser(userId);
    return mapAdminUserFromApi(unwrapApiData<RawAdminUser>(res.data));
  }

  async deactivateUser(userId: number): Promise<AdminUser> {
    const res = await adminClient.deactivateUser(userId);
    return mapAdminUserFromApi(unwrapApiData<RawAdminUser>(res.data));
  }

  async impersonateUser(userId: number): Promise<ImpersonateResult> {
    const res = await adminClient.impersonateUser(userId);
    const payload = res.data;
    return {
      accessToken: payload.access_token,
      user: mapUserFromApi(payload.user),
      target: mapAdminUserFromApi(payload.target as RawAdminUser),
    };
  }

  async listFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      const res = await adminClient.listFeatureFlags({ silent: true });
      return mapFeatureFlagsFromApi(res.data.data ?? []);
    } catch (error) {
      if (isAbortError(error)) throw error;
      console.error('[AdminService] listFeatureFlags failed', error);
      throw error;
    }
  }

  async updateFeatureFlag(key: string, value: boolean): Promise<FeatureFlag> {
    const res = await adminClient.updateFeatureFlag(key, value);
    return mapFeatureFlagFromApi(unwrapApiData<RawFeatureFlag>(res.data));
  }

  async listAnnouncements(): Promise<SystemAnnouncement[]> {
    try {
      const res = await adminClient.listAnnouncements({ silent: true });
      return mapSystemAnnouncementsFromApi(res.data.data ?? []);
    } catch (error) {
      if (isAbortError(error)) throw error;
      console.error('[AdminService] listAnnouncements failed', error);
      throw error;
    }
  }

  async createAnnouncement(payload: CreateSystemAnnouncementPayload): Promise<SystemAnnouncement> {
    const res = await adminClient.createAnnouncement(payload);
    return mapSystemAnnouncementFromApi(unwrapApiData<RawSystemAnnouncement>(res.data));
  }

  async toggleAnnouncementActive(id: number): Promise<SystemAnnouncement> {
    const res = await adminClient.toggleAnnouncementActive(id);
    return mapSystemAnnouncementFromApi(unwrapApiData<RawSystemAnnouncement>(res.data));
  }

  static featureFlagsRecord(flags: FeatureFlag[]): Record<string, FeatureFlag> {
    return featureFlagsToRecord(flags);
  }

  static formatTierLabel(tier: AdminUser['effectiveTier']): string {
    switch (tier) {
      case 'premium':
        return 'Premium';
      case 'pro':
        return 'Pro';
      default:
        return 'Ingyenes';
    }
  }

  static formatHouseholdRole(role: string): string {
    switch (role) {
      case 'admin':
        return 'Háztartás admin';
      case 'editor':
        return 'Szerkesztő';
      case 'viewer':
        return 'Olvasó';
      default:
        return role;
    }
  }
}

export const adminService = AdminService.getInstance();
export { AdminService };
