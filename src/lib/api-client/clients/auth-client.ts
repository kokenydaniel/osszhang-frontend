import type { ApiClient } from '../api-client';
import {
  StatusCodes,
  SingleEntityResponse,
  EmptyResponse,
  isSingleEntityApiResponse,
  isMaintenanceModeResponse,
} from '../response';
import type { RawApiUser } from '@/types';

export class AuthClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = '') {}

  async login(credentials: { username: string; password?: string }): SingleEntityResponse<{ access_token: string; token: string; user: RawApiUser }> {
    try {
      const [status, response] = await this.apiClient.postJson(
        `${this.baseEndpoint}/login`,
        credentials,
        { silent: true },
      );
      if (isMaintenanceModeResponse(status, response)) {
        return this.apiClient.response(StatusCodes.Http503, response);
      }
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ access_token: string; token: string; user: RawApiUser }>(response, ['access_token', 'user'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async register(data: {
    username: string;
    password?: string;
    password_confirmation?: string;
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
    household_name?: string;
  }): SingleEntityResponse<{ access_token: string; token: string; user: RawApiUser }> {
    try {
      const [status, response] = await this.apiClient.postJson(
        `${this.baseEndpoint}/register`,
        data,
        { silent: true },
      );
      if (isMaintenanceModeResponse(status, response)) {
        return this.apiClient.response(StatusCodes.Http503, response);
      }
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && isSingleEntityApiResponse<{ access_token: string; token: string; user: RawApiUser }>(response, ['access_token', 'user'])) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async logout(): EmptyResponse {
    try {
      const [status, response] = await this.apiClient.postJson(`${this.baseEndpoint}/logout`);
      if (status === StatusCodes.Http200) {
        return this.apiClient.response(status, null);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async me(): SingleEntityResponse<RawApiUser> {
    try {
      const [status, response] = await this.apiClient.getJson(`${this.baseEndpoint}/me`);
      if (isMaintenanceModeResponse(status, response)) {
        return this.apiClient.response(StatusCodes.Http503, response);
      }
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<RawApiUser>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    password?: string;
    password_confirmation?: string;
  }): SingleEntityResponse<RawApiUser> {
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/me`, data);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<RawApiUser>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async changePassword(data: { password: string; password_confirmation: string }): SingleEntityResponse<{ message: string; must_change_password: boolean }> {
    try {
      const [status, response] = await this.apiClient.postJson(
        `${this.baseEndpoint}/me/change-password`,
        data,
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ message: string; must_change_password: boolean }>(response, ['message'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }
}
