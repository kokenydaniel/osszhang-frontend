import type { ApiClient } from '../api-client';
import { StatusCodes, SingleEntityResponse, CollectionResponse, EmptyResponse, isSingleEntityApiResponse, isCollectionApiResponse } from '../response';
import type { RequestOptions } from '../response';
import type { RawApiWallet, WalletProfile } from '@/types';

export class WalletClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'wallets') {}

  async getAll(): CollectionResponse<RawApiWallet> {
    try {
      const [status, response] = await this.apiClient.getJson(this.baseEndpoint);
      if (status === StatusCodes.Http200 && isCollectionApiResponse<RawApiWallet>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async create(data: { name: string; isShared?: boolean; ownerId?: number }, options?: RequestOptions): SingleEntityResponse<RawApiWallet> {
    try {
      const [status, response] = await this.apiClient.postJson(this.baseEndpoint, data, options);
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && isSingleEntityApiResponse<RawApiWallet>(response, ['id'])) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async update(id: number, data: { name: string }): SingleEntityResponse<RawApiWallet> {
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/${id}`, data);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<RawApiWallet>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateManualBalance(id: number, manualBalance: number): SingleEntityResponse<RawApiWallet> {
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/${id}/manual-balance`, {
        manual_balance: manualBalance,
      });
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<RawApiWallet>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async delete(id: number): EmptyResponse {
    try {
      const [status, response] = await this.apiClient.deleteJson(`${this.baseEndpoint}/${id}`);
      if (status === StatusCodes.Http200 || status === StatusCodes.Http204) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http204, null);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }
}

export type { WalletProfile };
