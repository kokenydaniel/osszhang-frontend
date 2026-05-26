import type { ApiClient } from '../api-client';
import type { RequestOptions } from '../response';
import type { AdminUsersQuery } from '@/types/admin';
import type { RawAdminUsersResponse } from '@/mappers/admin.mapper';
import type { RawApiUser } from '@/types';

export class AdminClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'admin') {}

  listUsers(query?: AdminUsersQuery, options?: RequestOptions) {
    const params: Record<string, string | number> = {};
    if (query?.search) params.search = query.search;
    if (query?.status && query.status !== 'all') params.status = query.status;
    if (query?.lifetimeAdmin && query.lifetimeAdmin !== 'all') {
      params.lifetime_admin = query.lifetimeAdmin;
    }
    if (query?.page) params.page = query.page;
    if (query?.perPage) params.per_page = query.perPage;

    return this.apiClient.getJson<RawAdminUsersResponse>(`${this.baseEndpoint}/users`, {
      ...options,
      params,
    });
  }

  activateUser(userId: number) {
    return this.apiClient.patchJson<{ data: RawAdminUsersResponse['data'][number] }>(
      `${this.baseEndpoint}/users/${userId}/activate`,
    );
  }

  deactivateUser(userId: number) {
    return this.apiClient.patchJson<{ data: RawAdminUsersResponse['data'][number] }>(
      `${this.baseEndpoint}/users/${userId}/deactivate`,
    );
  }

  impersonateUser(userId: number) {
    return this.apiClient.postJson<{
      access_token: string;
      token_type: string;
      user: RawApiUser;
      target: RawAdminUsersResponse['data'][number];
    }>(`${this.baseEndpoint}/users/${userId}/impersonate`);
  }

  listFeatureFlags(options?: RequestOptions) {
    return this.apiClient.getJson<import('@/mappers/featureFlags.mapper').RawFeatureFlagsResponse>(
      `${this.baseEndpoint}/features`,
      options,
    );
  }

  updateFeatureFlag(key: string, value: boolean) {
    return this.apiClient.patchJson<{ data: import('@/mappers/featureFlags.mapper').RawFeatureFlag }>(
      `${this.baseEndpoint}/features/${encodeURIComponent(key)}`,
      { value },
    );
  }

  listAnnouncements(options?: RequestOptions) {
    return this.apiClient.getJson<import('@/mappers/announcements.mapper').RawSystemAnnouncementsResponse>(
      `${this.baseEndpoint}/announcements`,
      options,
    );
  }

  createAnnouncement(payload: { message: string; type: string }) {
    return this.apiClient.postJson<{ data: import('@/mappers/announcements.mapper').RawSystemAnnouncement }>(
      `${this.baseEndpoint}/announcements`,
      payload,
    );
  }

  toggleAnnouncementActive(announcementId: number) {
    return this.apiClient.patchJson<{ data: import('@/mappers/announcements.mapper').RawSystemAnnouncement }>(
      `${this.baseEndpoint}/announcements/${announcementId}/toggle`,
    );
  }
}
