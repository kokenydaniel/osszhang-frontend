import type { ApiClient } from '../api-client';
import { StatusCodes, SingleEntityResponse, CollectionResponse, EmptyResponse, isSingleEntityApiResponse, isCollectionApiResponse } from '../response';
import type { Investment } from '@/types';
import type { RequestOptions } from '../response';

export class InvestmentsClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'investments') {}

  async getAll(options?: RequestOptions): CollectionResponse<Investment> {
    try {
      const [status, response] = await this.apiClient.getJson(this.baseEndpoint, options);
      if (status === StatusCodes.Http200 && isCollectionApiResponse<Investment>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async create(data: Omit<Investment, 'id'>): SingleEntityResponse<Investment> {
    try {
      const [status, response] = await this.apiClient.postJson(this.baseEndpoint, data);
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && isSingleEntityApiResponse<Investment>(response, ['id'])) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async update(id: number, data: Partial<Omit<Investment, 'id'>>): SingleEntityResponse<Investment> {
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/${id}`, data);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<Investment>(response, ['id'])) {
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
