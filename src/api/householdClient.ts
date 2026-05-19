import apiClient from './apiClient';
import { UserProfile } from '@/types';

export const householdClient = {
  get: () => apiClient.get<{ id: number; name: string; invite_code: string; users: UserProfile[]; manual_balance: number }>('/household'),
  update: (data: { 
    name?: string; 
    manual_balance?: number; 
    business_enabled?: boolean; 
    business_name?: string; 
    shopify_shop_url?: string; 
    shopify_access_token?: string; 
    utility_split_enabled?: boolean; 
  }) => apiClient.put<{ id: number; name: string; invite_code: string; manual_balance: number }>('/household', data),
  updateCategories: (categories: string[]) => apiClient.put<{ categories: string[] }>('/household/categories', { categories }),
  updateCode: (code: string) => apiClient.put<{ invite_code: string }>('/household/code', { invite_code: code }),
  createMember: (data: Omit<UserProfile, 'id' | 'role' | 'permissions' | 'firstName' | 'lastName'> & { role?: string; permissions?: string[]; password?: string; first_name?: string; last_name?: string; firstName?: string; lastName?: string }) => 
    apiClient.post<UserProfile>('/household/members', data),
  updateMember: (userId: number, data: { role?: string, permissions?: string[] }) => 
    apiClient.put<UserProfile>(`/household/members/${userId}`, data),
  deleteMember: (userId: number) => apiClient.delete(`/household/members/${userId}`),
};
