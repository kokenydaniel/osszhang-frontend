import apiClient from './apiClient';
import { UserProfile, RawApiUser } from '@/types';

export const authClient = {
  login: (credentials: Pick<UserProfile, 'email'> & { password?: string }) => 
    apiClient.post<{ access_token: string; token: string; user: RawApiUser }>('/login', credentials),
  register: (data: Omit<UserProfile, 'id' | 'role' | 'permissions' | 'household' | 'firstName' | 'lastName'> & { password?: string; password_confirmation?: string; first_name?: string; last_name?: string; firstName?: string; lastName?: string; invite_code?: string; household_name?: string }) => 
    apiClient.post<{ access_token: string; token: string; user: RawApiUser }>('/register', data),
  logout: () => apiClient.post<{ message: string }>('/logout'),
  me: () => apiClient.get<RawApiUser>('/me'),
  updateProfile: (data: { firstName?: string; lastName?: string; email?: string; password?: string; password_confirmation?: string }) => 
    apiClient.put<RawApiUser>('/me', data),
};
