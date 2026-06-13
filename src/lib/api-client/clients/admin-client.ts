import type { ApiClient } from '../api-client';
import { StatusCodes, SingleEntityResponse, EmptyResponse, isSingleEntityApiResponse } from '../response';
import type { RequestOptions } from '../response';
import { unwrapApiCollection, unwrapApiEntity } from '../type-guards';
import type {
  AdminTierGrantPayload,
  AdminUsersQuery,
  AdminUsersApiResponse,
  AdminHouseholdsQuery,
  AdminHouseholdsApiResponse,
  AdminHousehold,
  AdminHouseholdAiSettingsPayload,
  FeatureFlagsApiResponse,
  FeatureFlag,
  SystemAnnouncementsApiResponse,
  SystemAnnouncement,
  ProductUpdatesApiResponse,
  ProductUpdate,
  ProductUpdatePayload,
} from '@/types/admin';
import type { RawApiUser } from '@/types';
import type { FeedbackCategory, FeedbackStatus } from '@/config/feedback';
import type { FeedbackReport } from '@/types/feedback';

export class AdminClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'admin') {}

  async listHouseholds(
    query?: AdminHouseholdsQuery,
    options?: RequestOptions,
  ): SingleEntityResponse<AdminHouseholdsApiResponse> {
    const params: Record<string, string | number> = {};
    if (query?.search) params.search = query.search;
    if (query?.tier && query.tier !== 'all') params.tier = query.tier;
    if (query?.page) params.page = query.page;
    if (query?.perPage) params.per_page = query.perPage;

    try {
      const [status, response] = await this.apiClient.getJson(`${this.baseEndpoint}/households`, {
        ...options,
        params,
      });
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<AdminHouseholdsApiResponse>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async showHousehold(householdId: number): SingleEntityResponse<{ data: AdminHousehold }> {
    try {
      const [status, response] = await this.apiClient.getJson(`${this.baseEndpoint}/households/${householdId}`);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ data: AdminHousehold }>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateHouseholdTierGrant(
    householdId: number,
    payload: AdminTierGrantPayload,
  ): SingleEntityResponse<{ data: AdminHousehold }> {
    try {
      const [status, response] = await this.apiClient.patchJson(
        `${this.baseEndpoint}/households/${householdId}/tier-grant`,
        payload,
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ data: AdminHousehold }>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateHouseholdAiSettings(
    householdId: number,
    payload: AdminHouseholdAiSettingsPayload,
  ): SingleEntityResponse<{ data: AdminHousehold }> {
    try {
      const [status, response] = await this.apiClient.patchJson(
        `${this.baseEndpoint}/households/${householdId}/ai-settings`,
        payload,
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ data: AdminHousehold }>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async deleteHousehold(householdId: number, confirmName: string): EmptyResponse {
    try {
      const [status, response] = await this.apiClient.deleteJson(`${this.baseEndpoint}/households/${householdId}`, {
        confirm_name: confirmName,
      });
      if (status === StatusCodes.Http200 || status === StatusCodes.Http204) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http204, null);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

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

  async resetUserPassword(
    userId: number,
    password: string,
    passwordConfirmation: string,
  ): SingleEntityResponse<{ data: AdminUsersApiResponse['data'][number]; message?: string }> {
    try {
      const [status, response] = await this.apiClient.postJson(
        `${this.baseEndpoint}/users/${userId}/reset-password`,
        {
          password,
          password_confirmation: passwordConfirmation,
        },
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

  async listProductUpdates(options?: RequestOptions): SingleEntityResponse<ProductUpdatesApiResponse> {
    try {
      const [status, response] = await this.apiClient.getJson(
        `${this.baseEndpoint}/product-updates`,
        options,
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<ProductUpdatesApiResponse>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async createProductUpdate(payload: ProductUpdatePayload): SingleEntityResponse<{ data: ProductUpdate }> {
    try {
      const [status, response] = await this.apiClient.postJson(
        `${this.baseEndpoint}/product-updates`,
        payload,
      );
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && isSingleEntityApiResponse<{ data: ProductUpdate }>(response, ['data'])) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateProductUpdate(
    id: number,
    payload: ProductUpdatePayload,
  ): SingleEntityResponse<{ data: ProductUpdate }> {
    try {
      const [status, response] = await this.apiClient.putJson(
        `${this.baseEndpoint}/product-updates/${id}`,
        payload,
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ data: ProductUpdate }>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async deleteProductUpdate(id: number): SingleEntityResponse<{ data: null }> {
    try {
      const [status, response] = await this.apiClient.deleteJson(
        `${this.baseEndpoint}/product-updates/${id}`,
      );
      if (status === StatusCodes.Http200) {
        return this.apiClient.response(status, response as { data: null });
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async toggleProductUpdateActive(id: number): SingleEntityResponse<{ data: ProductUpdate }> {
    try {
      const [status, response] = await this.apiClient.patchJson(
        `${this.baseEndpoint}/product-updates/${id}/toggle`,
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ data: ProductUpdate }>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async listAuditLogs(): SingleEntityResponse<{ data: unknown[] }> {
    try {
      const [status, response] = await this.apiClient.getJson(`${this.baseEndpoint}/audit-logs`);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ data: unknown[] }>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async listWebhooks(): SingleEntityResponse<{ data: unknown[] }> {
    try {
      const [status, response] = await this.apiClient.getJson(`${this.baseEndpoint}/webhooks`);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ data: unknown[] }>(response, ['data'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async createWebhook(body: { url: string; events: string[] }): SingleEntityResponse<{ data: { id: number; secret: string } }> {
    try {
      const [status, response] = await this.apiClient.postJson(`${this.baseEndpoint}/webhooks`, body);
      if (status === StatusCodes.Http201 && isSingleEntityApiResponse<{ data: { id: number; secret: string } }>(response, ['data'])) {
        return this.apiClient.response(status as StatusCodes.Http201, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async deleteWebhook(id: number): EmptyResponse {
    try {
      const [status, response] = await this.apiClient.deleteJson(`${this.baseEndpoint}/webhooks/${id}`);
      if (status === StatusCodes.Http204 || status === StatusCodes.Http200) {
        return this.apiClient.response(status as StatusCodes.Http204, null);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async listFeedbackReports(query?: {
    status?: FeedbackStatus | 'all';
    category?: FeedbackCategory | 'all';
  }): SingleEntityResponse<{ items: FeedbackReport[]; attentionCount: number }> {
    const params: Record<string, string> = {};
    if (query?.status && query.status !== 'all') params.status = query.status;
    if (query?.category && query.category !== 'all') params.category = query.category;

    try {
      const [status, response] = await this.apiClient.getJson(`${this.baseEndpoint}/feedback-reports`, { params });
      const items = unwrapApiCollection<FeedbackReport>(response, ['id']);
      if (status === StatusCodes.Http200 && items) {
        const attentionCount =
          typeof response === 'object' &&
          response !== null &&
          'meta' in response &&
          typeof (response as { meta?: { attentionCount?: number } }).meta?.attentionCount === 'number'
            ? (response as { meta: { attentionCount: number } }).meta.attentionCount
            : 0;
        return this.apiClient.response(status, { items, attentionCount });
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async feedbackAttentionCount(): SingleEntityResponse<{ count: number }> {
    try {
      const [status, response] = await this.apiClient.getJson(
        `${this.baseEndpoint}/feedback-reports/attention-count`,
      );
      const entity = unwrapApiEntity<{ count: number }>(response, ['count']);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async showFeedbackReport(id: number): SingleEntityResponse<FeedbackReport> {
    try {
      const [status, response] = await this.apiClient.getJson(`${this.baseEndpoint}/feedback-reports/${id}`);
      const entity = unwrapApiEntity<FeedbackReport>(response, ['id']);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async replyFeedbackReport(id: number, body: string): SingleEntityResponse<FeedbackReport> {
    try {
      const [statusCode, response] = await this.apiClient.postJson(
        `${this.baseEndpoint}/feedback-reports/${id}/messages`,
        { body },
      );
      const entity = unwrapApiEntity<FeedbackReport>(response, ['id']);
      if (statusCode === StatusCodes.Http200 && entity) {
        return this.apiClient.response(statusCode, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateFeedbackReportStatus(
    id: number,
    status: FeedbackStatus,
  ): SingleEntityResponse<FeedbackReport> {
    try {
      const [statusCode, response] = await this.apiClient.patchJson(`${this.baseEndpoint}/feedback-reports/${id}`, {
        status,
      });
      const entity = unwrapApiEntity<FeedbackReport>(response, ['id']);
      if (statusCode === StatusCodes.Http200 && entity) {
        return this.apiClient.response(statusCode, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }
}
