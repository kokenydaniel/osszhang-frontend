import apiClient from './apiClient';
import { RawApiUser } from '@/types';

export const authClient = {
  login: (credentials: { username: string; password?: string }) =>
    apiClient.post<{ access_token: string; token: string; user: RawApiUser }>('/login', credentials),
  register: (data: {
    username: string;
    password?: string;
    password_confirmation?: string;
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
    household_name?: string;
  }) => apiClient.post<{ access_token: string; token: string; user: RawApiUser }>('/register', data),
  logout: () => apiClient.post<{ message: string }>('/logout'),
  me: () => apiClient.get<RawApiUser>('/me'),
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    password?: string;
    password_confirmation?: string;
  }) => apiClient.put<RawApiUser>('/me', data),
  changePassword: (data: { password: string; password_confirmation: string }) =>
    apiClient.post<{ message: string; must_change_password: boolean }>('/me/change-password', data),
};
