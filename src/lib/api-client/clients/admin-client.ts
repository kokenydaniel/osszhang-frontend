import type { ApiClient } from '../api-client';
import { StatusCodes, SingleEntityResponse, isSingleEntityApiResponse } from '../response';
import type { RequestOptions } from '../response';
import type {
  AdminTierGrantPayload,
  AdminUsersQuery,
  AdminUsersApiResponse,
  FeatureFlagsApiResponse,
  FeatureFlag,
  SystemAnnouncementsApiResponse,
  SystemAnnouncement,
} from '@/types/admin';
import type { RawApiUser } from '@/types';

export class AdminClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'admin') {}

  async listUsers(query?: AdminUsersQuery, options?: RequestOptions): SingleEntityResponse<AdminUsersApiResponse> {
    const params: Record<string, string | number> = {};
    if (query?.search) params.search = query.search;
    if (query?.status && query.status !== 'all') params.status = query.status;
    if (query?.lifetimeAdmin && query.lifetimeAdmin !== 'all') {
      params.lifetime_admin = query.lifetimeAdmin;
    }
    if (query?.page) params.page = query.page;
    if (query?.perPage) params.per_page = query.perPage;

    try {
      const [status, response] = await this.apiClient.getJson(`${this.baseEndpoint}/users`, {
        ...options,
        params,
      });
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<AdminUsersApiResponse>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async activateUser(userId: number): SingleEntityResponse<{ data: AdminUsersApiResponse['data'][number] }> {
    try {
      const [status, response] = await this.apiClient.patchJson(
        `${this.baseEndpoint}/users/${userId}/activate`,
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ data: AdminUsersApiResponse['data'][number] }>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async deactivateUser(userId: number): SingleEntityResponse<{ data: AdminUsersApiResponse['data'][number] }> {
    try {
      const [status, response] = await this.apiClient.patchJson(
        `${this.baseEndpoint}/users/${userId}/deactivate`,
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ data: AdminUsersApiResponse['data'][number] }>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateUserTierGrant(
    userId: number,
    payload: AdminTierGrantPayload,
  ): SingleEntityResponse<{ data: AdminUsersApiResponse['data'][number] }> {
    try {
      const [status, response] = await this.apiClient.patchJson(
        `${this.baseEndpoint}/users/${userId}/tier-grant`,
        payload,
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ data: AdminUsersApiResponse['data'][number] }>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async impersonateUser(userId: number): SingleEntityResponse<{
    access_token: string;
    token_type: string;
    user: RawApiUser;
    target: AdminUsersApiResponse['data'][number];
  }> {
    try {
      const [status, response] = await this.apiClient.postJson(`${this.baseEndpoint}/users/${userId}/impersonate`);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{
        access_token: string;
        token_type: string;
        user: RawApiUser;
        target: AdminUsersApiResponse['data'][number];
      }>(response, ['access_token', 'user'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async listFeatureFlags(options?: RequestOptions): SingleEntityResponse<FeatureFlagsApiResponse> {
    try {
      const [status, response] = await this.apiClient.getJson(
        `${this.baseEndpoint}/features`,
        options,
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<FeatureFlagsApiResponse>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateFeatureFlag(key: string, value: boolean): SingleEntityResponse<{ data: FeatureFlag }> {
    try {
      const [status, response] = await this.apiClient.patchJson(
        `${this.baseEndpoint}/features/${encodeURIComponent(key)}`,
        { value },
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ data: FeatureFlag }>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async listAnnouncements(options?: RequestOptions): SingleEntityResponse<SystemAnnouncementsApiResponse> {
    try {
      const [status, response] = await this.apiClient.getJson(
        `${this.baseEndpoint}/announcements`,
        options,
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<SystemAnnouncementsApiResponse>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async createAnnouncement(payload: { message: string; type: string }): SingleEntityResponse<{ data: SystemAnnouncement }> {
    try {
      const [status, response] = await this.apiClient.postJson(
        `${this.baseEndpoint}/announcements`,
        payload,
      );
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && isSingleEntityApiResponse<{ data: SystemAnnouncement }>(response, ['data'])) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateAnnouncement(
    announcementId: number,
    payload: { message: string; type: string },
  ): SingleEntityResponse<{ data: SystemAnnouncement }> {
    try {
      const [status, response] = await this.apiClient.putJson(
        `${this.baseEndpoint}/announcements/${announcementId}`,
        payload,
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ data: SystemAnnouncement }>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async deleteAnnouncement(announcementId: number): SingleEntityResponse<{ data: null }> {
    try {
      const [status, response] = await this.apiClient.deleteJson(
        `${this.baseEndpoint}/announcements/${announcementId}`,
      );
      if (status === StatusCodes.Http200) {
        return this.apiClient.response(status, response as { data: null });
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async toggleAnnouncementActive(announcementId: number): SingleEntityResponse<{ data: SystemAnnouncement }> {
    try {
      const [status, response] = await this.apiClient.patchJson(
        `${this.baseEndpoint}/announcements/${announcementId}/toggle`,
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ data: SystemAnnouncement }>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }
}
