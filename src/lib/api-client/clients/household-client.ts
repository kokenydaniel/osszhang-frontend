import type { ApiClient } from '../api-client';
import type { UserProfile } from '@/types';

export class HouseholdClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'household') {}

  get() {
    return this.apiClient.getJson<{ id: number; name: string; invite_code: string; users: UserProfile[]; manual_balance: number }>(
      this.baseEndpoint,
    );
  }

  update(data: {
    name?: string;
    manual_balance?: number;
    budget_enabled?: boolean;
    savings_enabled?: boolean;
    debts_enabled?: boolean;
    utilities_enabled?: boolean;
    meters_enabled?: boolean;
    savings_settings?: import('@/lib/savingsSettings').SavingsSettings;
    debts_settings?: import('@/lib/debtsSettings').DebtsSettings;
    meters_settings?: import('@/lib/metersSettings').MetersSettings;
    onboarding_completed?: boolean;
    business_enabled?: boolean;
    business_name?: string;
    shopify_import_enabled?: boolean;
    shopify_shop_url?: string;
    shopify_access_token?: string;
    utility_split_enabled?: boolean;
    utility_split_partner_id?: number | null;
    business_settings?: import('@/lib/businessSettings').BusinessSettings;
    utility_templates?: import('@/lib/utilityTemplates').UtilityTemplate[];
  }) {
    return this.apiClient.putJson(this.baseEndpoint, data);
  }

  updateCategories(categories: string[]) {
    return this.apiClient.putJson<{ categories: string[] }>(`${this.baseEndpoint}/categories`, { categories });
  }

  updateCode(code: string) {
    return this.apiClient.putJson<{ invite_code: string }>(`${this.baseEndpoint}/code`, { invite_code: code });
  }

  createMember(data: {
    username: string;
    password: string;
    role?: string;
    permissions?: string[];
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
  }) {
    return this.apiClient.postJson<UserProfile>(`${this.baseEndpoint}/members`, data);
  }

  updateMember(userId: number, data: { role?: string; permissions?: string[] }) {
    return this.apiClient.putJson<UserProfile>(`${this.baseEndpoint}/members/${userId}`, data);
  }

  deleteMember(userId: number) {
    return this.apiClient.deleteJson(`${this.baseEndpoint}/members/${userId}`);
  }

  destroy(confirmName: string) {
    return this.apiClient.deleteJson(`${this.baseEndpoint}`, { confirm_name: confirmName });
  }
}
