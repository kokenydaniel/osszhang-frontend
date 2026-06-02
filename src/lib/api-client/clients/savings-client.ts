import type { ApiClient } from '../api-client';
import { StatusCodes, SingleEntityResponse, CollectionResponse, EmptyResponse, isSingleEntityApiResponse, isCollectionApiResponse } from '../response';
import type { LedgerEntry, SavingsAccount } from '@/types';
import type { RequestOptions } from '../response';

export class SavingsClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'savings') {}

  async getAll(walletId?: number | null, options?: RequestOptions): CollectionResponse<SavingsAccount> {
    try {
      const [status, response] = await this.apiClient.getJson(this.baseEndpoint, {
        ...options,
        params: {
          ...options?.params,
          ...(walletId ? { walletId } : {}),
        },
      });
      if (status === StatusCodes.Http200 && isCollectionApiResponse<SavingsAccount>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async create(data: Record<string, unknown>): SingleEntityResponse<SavingsAccount> {
    try {
      const [status, response] = await this.apiClient.postJson(this.baseEndpoint, data);
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && isSingleEntityApiResponse<SavingsAccount>(response, ['id'])) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async update(id: number, data: Record<string, unknown>): SingleEntityResponse<SavingsAccount> {
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/${id}`, data);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<SavingsAccount>(response, ['id'])) {
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

  async addEntry(savingsId: number, entry: Omit<LedgerEntry, 'id'>): SingleEntityResponse<SavingsAccount> {
    try {
      const [status, response] = await this.apiClient.postJson(`${this.baseEndpoint}/${savingsId}/entries`, entry);
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && isSingleEntityApiResponse<SavingsAccount>(response, ['id'])) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateEntry(savingsId: number, entryId: number, entry: Partial<Omit<LedgerEntry, 'id'>>): SingleEntityResponse<SavingsAccount> {
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/${savingsId}/entries/${entryId}`, entry);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<SavingsAccount>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async deleteEntry(savingsId: number, entryId: number): SingleEntityResponse<SavingsAccount> {
    try {
      const [status, response] = await this.apiClient.deleteJson(`${this.baseEndpoint}/${savingsId}/entries/${entryId}`);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<SavingsAccount>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }
}
