import type { ApiClient } from '../api-client';
import { StatusCodes, SingleEntityResponse, EmptyResponse, isSingleEntityApiResponse } from '../response';
import type { RequestOptions } from '../response';
import type { UtilitiesIndexResponse, UtilityBill, UtilitySettlement } from '@/types';

export class UtilitiesClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'utilities') {}

  async getAll(options?: RequestOptions): SingleEntityResponse<UtilitiesIndexResponse> {
    try {
      const [status, response] = await this.apiClient.getJson(this.baseEndpoint, options);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<UtilitiesIndexResponse>(response, ['bills'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async create(data: Omit<UtilityBill, 'id'>): SingleEntityResponse<UtilityBill> {
    try {
      const [status, response] = await this.apiClient.postJson(this.baseEndpoint, data);
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && isSingleEntityApiResponse<UtilityBill>(response, ['id'])) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async update(id: number, data: Partial<Omit<UtilityBill, 'id'>>): SingleEntityResponse<UtilityBill> {
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/${id}`, data);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<UtilityBill>(response, ['id'])) {
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

  async cloneMonth(month: number, year: number): SingleEntityResponse<{ message: string } & UtilitiesIndexResponse> {
    try {
      const [status, response] = await this.apiClient.postJson(`${this.baseEndpoint}/clone`, { month, year });
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ message: string } & UtilitiesIndexResponse>(response, ['message'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async settleMonth(month: number, year: number): SingleEntityResponse<{ message: string; settlement: UtilitySettlement } & UtilitiesIndexResponse> {
    try {
      const [status, response] = await this.apiClient.postJson(
        `${this.baseEndpoint}/settlement`,
        { month, year },
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ message: string; settlement: UtilitySettlement } & UtilitiesIndexResponse>(response, ['message'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async unsettleMonth(month: number, year: number): SingleEntityResponse<{ message: string; manual_balance?: number } & UtilitiesIndexResponse> {
    try {
      const [status, response] = await this.apiClient.deleteJson(
        `${this.baseEndpoint}/settlement`,
        undefined,
        { params: { month, year } },
      );
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ message: string; manual_balance?: number } & UtilitiesIndexResponse>(response, ['message'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }
}
