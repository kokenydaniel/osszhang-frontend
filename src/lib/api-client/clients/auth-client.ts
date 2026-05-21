import type { ApiClient } from '../api-client';
import type { RawApiUser } from '@/types';

export class AuthClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = '') {}

  login(credentials: { username: string; password?: string }) {
    return this.apiClient.postJson<{ access_token: string; token: string; user: RawApiUser }>(
      `${this.baseEndpoint}/login`,
      credentials,
    );
  }

  register(data: {
    username: string;
    password?: string;
    password_confirmation?: string;
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
    household_name?: string;
  }) {
    return this.apiClient.postJson<{ access_token: string; token: string; user: RawApiUser }>(
      `${this.baseEndpoint}/register`,
      data,
    );
  }

  logout() {
    return this.apiClient.postJson<{ message: string }>(`${this.baseEndpoint}/logout`);
  }

  me() {
    return this.apiClient.getJson<RawApiUser>(`${this.baseEndpoint}/me`);
  }

  updateProfile(data: {
    firstName?: string;
    lastName?: string;
    password?: string;
    password_confirmation?: string;
  }) {
    return this.apiClient.putJson<RawApiUser>(`${this.baseEndpoint}/me`, data);
  }

  changePassword(data: { password: string; password_confirmation: string }) {
    return this.apiClient.postJson<{ message: string; must_change_password: boolean }>(
      `${this.baseEndpoint}/me/change-password`,
      data,
    );
  }
}
