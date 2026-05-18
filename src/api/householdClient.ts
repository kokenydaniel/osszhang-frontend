import apiClient from './apiClient';
import { UserProfile } from '@/types';

export const householdClient = {
  get: () => apiClient.get<{ id: number; name: string; invite_code: string; users: UserProfile[] }>('/household'),
  updateCategories: (categories: string[]) => apiClient.put<{ categories: string[] }>('/household/categories', { categories }),
  updateCode: (code: string) => apiClient.put<{ invite_code: string }>('/household/code', { invite_code: code }),
  createMember: (data: Omit<UserProfile, 'id' | 'role' | 'permissions' | 'firstName' | 'lastName'> & { role?: string; permissions?: string[]; password?: string; first_name?: string; last_name?: string; firstName?: string; lastName?: string }) => 
    apiClient.post<UserProfile>('/household/members', data),
  updateMember: (userId: number, data: { role?: string, permissions?: string[] }) => 
    apiClient.put<UserProfile>(`/household/members/${userId}`, data),
  deleteMember: (userId: number) => apiClient.delete(`/household/members/${userId}`),
};
