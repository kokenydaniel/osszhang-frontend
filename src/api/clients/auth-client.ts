import type { AxiosInstance } from 'axios';
import type { RawApiUser } from '@/types';

export class AuthClient {
  constructor(protected http: AxiosInstance) {}

  login(credentials: { username: string; password?: string }) {
    return this.http.post<{ access_token: string; token: string; user: RawApiUser }>('/login', credentials);
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
    return this.http.post<{ access_token: string; token: string; user: RawApiUser }>('/register', data);
  }

  logout() {
    return this.http.post<{ message: string }>('/logout');
  }

  me() {
    return this.http.get<RawApiUser>('/me');
  }

  updateProfile(data: {
    firstName?: string;
    lastName?: string;
    password?: string;
    password_confirmation?: string;
  }) {
    return this.http.put<RawApiUser>('/me', data);
  }

  changePassword(data: { password: string; password_confirmation: string }) {
    return this.http.post<{ message: string; must_change_password: boolean }>('/me/change-password', data);
  }
}
