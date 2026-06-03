import type { ApiClient } from '../api-client';
import {
  StatusCodes,
  type SingleEntityResponse,
  type EmptyResponse,
  isSingleEntityApiResponse,
} from '../response';
import type { RequestOptions } from '../response';
import type {
  PocketMoneyEntry,
  PocketMoneyIndex,
  CreatePocketMoneyEntryPayload,
  UpdatePocketMoneyEntryPayload,
} from '@/types/pocket-money';

function isPocketMoneyIndex(value: unknown): value is PocketMoneyIndex {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return Array.isArray(o.entries) && Array.isArray(o.members);
}

export class PocketMoneyClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'pocket-money') {}

  async getIndex(year?: number, month?: number, options?: RequestOptions) {
    try {
      const [status, response] = await this.apiClient.getJson(this.baseEndpoint, {
        ...options,
        params: {
          ...options?.params,
          ...(year ? { year } : {}),
          ...(month ? { month } : {}),
        },
      });
      if (status === StatusCodes.Http200 && isPocketMoneyIndex(response)) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async create(data: CreatePocketMoneyEntryPayload): SingleEntityResponse<PocketMoneyEntry> {
    try {
      const [status, response] = await this.apiClient.postJson(this.baseEndpoint, data);
      if (
        (status === StatusCodes.Http200 || status === StatusCodes.Http201) &&
        isSingleEntityApiResponse<PocketMoneyEntry>(response, ['id', 'entryType'])
      ) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async update(id: number, data: UpdatePocketMoneyEntryPayload): SingleEntityResponse<PocketMoneyEntry> {
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/${id}`, data);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<PocketMoneyEntry>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async applyInterest(year: number, month: number) {
    try {
      const [status, response] = await this.apiClient.postJson(`${this.baseEndpoint}/apply-interest`, {
        year,
        month,
      });
      if (status === StatusCodes.Http200 && response && typeof response === 'object') {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async delete(id: number): EmptyResponse {
    try {
      const [status] = await this.apiClient.deleteJson(`${this.baseEndpoint}/${id}`);
      if (status === StatusCodes.Http200 || status === StatusCodes.Http204) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http204, null);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }
}
