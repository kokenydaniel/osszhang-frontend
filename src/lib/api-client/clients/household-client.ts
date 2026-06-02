import type { ApiClient } from '../api-client';
import { StatusCodes, SingleEntityResponse, EmptyResponse, isSingleEntityApiResponse } from '../response';
import { unwrapApiEntity } from '../type-guards';
import type { UserProfile } from '@/types';

export class HouseholdClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'household') {}

  async get(): SingleEntityResponse<{ id: number; name: string; invite_code: string; users: UserProfile[]; manual_balance: number }> {
    try {
      const [status, response] = await this.apiClient.getJson(this.baseEndpoint);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ id: number; name: string; invite_code: string; users: UserProfile[]; manual_balance: number }>(response, ['id', 'name'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async update(data: {
    name?: string;
    manual_balance?: number;
    budget_enabled?: boolean;
    budget_settings?: import('@/settings/budget').BudgetSettings;
    savings_enabled?: boolean;
    debts_enabled?: boolean;
    utilities_enabled?: boolean;
    meters_enabled?: boolean;
    savings_settings?: import('@/settings/savings').SavingsSettings;
    debts_settings?: import('@/settings/debts').DebtsSettings;
    meters_settings?: import('@/settings/meters').MetersSettings;
    onboarding_completed?: boolean;
    business_enabled?: boolean;
    business_name?: string;
    shopify_import_enabled?: boolean;
    shopify_shop_url?: string;
    shopify_access_token?: string;
    utility_split_enabled?: boolean;
    utility_split_partner_id?: number | null;
    business_settings?: import('@/settings/business').BusinessSettings;
    utility_templates?: import('@/config/utility-templates').UtilityTemplate[];
    utilities_settings?: import('@/settings/utilities').UtilitiesSettings;
    dashboard_settings?: import('@/settings/dashboard').DashboardSettings;
  }): SingleEntityResponse<{ id: number; [key: string]: unknown }> {
    try {
      const [status, response] = await this.apiClient.putJson(this.baseEndpoint, data);
      const entity = unwrapApiEntity<{ id: number; [key: string]: unknown }>(response, ['id']);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateCategories(categories: string[]): SingleEntityResponse<{ categories: string[] }> {
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/categories`, { categories });
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ categories: string[] }>(response, ['categories'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateCode(code: string): SingleEntityResponse<{ invite_code: string }> {
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/code`, { invite_code: code });
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ invite_code: string }>(response, ['invite_code'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async createMember(data: {
    username: string;
    password: string;
    role?: string;
    permissions?: string[];
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
  }): SingleEntityResponse<UserProfile> {
    try {
      const [status, response] = await this.apiClient.postJson(`${this.baseEndpoint}/members`, data);
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && isSingleEntityApiResponse<UserProfile>(response, ['id'])) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateMember(userId: number, data: { role?: string; permissions?: string[] }): SingleEntityResponse<UserProfile> {
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/members/${userId}`, data);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<UserProfile>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async deleteMember(userId: number): EmptyResponse {
    try {
      const [status, response] = await this.apiClient.deleteJson(`${this.baseEndpoint}/members/${userId}`);
      if (status === StatusCodes.Http200 || status === StatusCodes.Http204) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http204, null);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async destroy(confirmName: string): EmptyResponse {
    try {
      const [status, response] = await this.apiClient.deleteJson(this.baseEndpoint, { confirm_name: confirmName });
      if (status === StatusCodes.Http200 || status === StatusCodes.Http204) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http204, null);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }
}
