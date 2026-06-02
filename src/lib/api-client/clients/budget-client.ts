import type { ApiClient } from '../api-client';
import { StatusCodes, SingleEntityResponse, EmptyResponse, isSingleEntityApiResponse, isCollectionApiResponse } from '../response';
import type { RequestOptions } from '../response';
import type { BudgetListResponse, CashTransaction, LedgerEntry } from '@/types';

export class BudgetClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'transactions') {}

  async getAll(walletId?: number | null, options?: RequestOptions): SingleEntityResponse<BudgetListResponse> {
    try {
      const [status, response] = await this.apiClient.getJson(this.baseEndpoint, {
        ...options,
        params: {
          ...options?.params,
          ...(walletId ? { walletId } : {}),
        },
      });
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<BudgetListResponse>(response, ['transactions'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async getForPeriod(walletId: number, month: number, year: number, options?: RequestOptions): SingleEntityResponse<BudgetListResponse> {
    try {
      const [status, response] = await this.apiClient.getJson(this.baseEndpoint, {
        ...options,
        params: {
          ...options?.params,
          walletId,
          month,
          year,
        },
      });
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<BudgetListResponse>(response, ['transactions'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async getGoalRows(walletId: number | null | undefined, month: number, year: number, options?: RequestOptions): SingleEntityResponse<CashTransaction[]> {
    try {
      const [status, response] = await this.apiClient.getJson(`${this.baseEndpoint}/goal-rows`, {
        ...options,
        params: {
          ...options?.params,
          month,
          year,
          ...(walletId ? { walletId } : {}),
        },
      });
      if (status === StatusCodes.Http200 && isCollectionApiResponse<CashTransaction>(response, [])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async create(data: Omit<CashTransaction, 'id'>): SingleEntityResponse<CashTransaction> {
    try {
      const [status, response] = await this.apiClient.postJson(this.baseEndpoint, data);
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && isSingleEntityApiResponse<CashTransaction>(response, ['id'])) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async cloneMonth(month: number, year: number, walletId?: number | null): SingleEntityResponse<{ message: string }> {
    try {
      const [status, response] = await this.apiClient.postJson(`${this.baseEndpoint}/clone`, {
        month,
        year,
        ...(walletId ? { walletId } : {}),
      });
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ message: string }>(response, ['message'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async update(id: number, data: Partial<Omit<CashTransaction, 'id' | 'subItems'>>): SingleEntityResponse<CashTransaction> {
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/${id}`, data);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<CashTransaction>(response, ['id'])) {
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

  async addItem(txId: number | string, data: Omit<LedgerEntry, 'id'>): SingleEntityResponse<CashTransaction> {
    try {
      const [status, response] = await this.apiClient.postJson(`${this.baseEndpoint}/${txId}/items`, data);
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && isSingleEntityApiResponse<CashTransaction>(response, ['id'])) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateItem(
    txId: number | string,
    itemId: number,
    data: Omit<LedgerEntry, 'id'>,
  ): SingleEntityResponse<CashTransaction> {
    try {
      const [status, response] = await this.apiClient.putJson(
        `${this.baseEndpoint}/${txId}/items/${itemId}`,
        data,
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<CashTransaction>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async deleteItem(txId: number | string, itemId: number): SingleEntityResponse<CashTransaction> {
    try {
      const [status, response] = await this.apiClient.deleteJson(`${this.baseEndpoint}/${txId}/items/${itemId}`);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<CashTransaction>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }
}
