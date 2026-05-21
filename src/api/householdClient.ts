import apiClient from './apiClient';
import { UserProfile } from '@/types';

export const householdClient = {
  get: () => apiClient.get<{ id: number; name: string; invite_code: string; users: UserProfile[]; manual_balance: number }>('/household'),
  update: (data: {
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
  }) => apiClient.put('/household', data),
  updateCategories: (categories: string[]) => apiClient.put<{ categories: string[] }>('/household/categories', { categories }),
  updateCode: (code: string) => apiClient.put<{ invite_code: string }>('/household/code', { invite_code: code }),
  createMember: (data: {
    username: string;
    password: string;
    role?: string;
    permissions?: string[];
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
  }) => apiClient.post<UserProfile>('/household/members', data),
  updateMember: (userId: number, data: { role?: string, permissions?: string[] }) => 
    apiClient.put<UserProfile>(`/household/members/${userId}`, data),
  deleteMember: (userId: number) => apiClient.delete(`/household/members/${userId}`),
  destroy: (confirmName: string) =>
    apiClient.delete('/household', { data: { confirm_name: confirmName } }),
};
