import type { ApiClient } from '../api-client';
import { StatusCodes, SingleEntityResponse, CollectionResponse, EmptyResponse, isSingleEntityApiResponse, isCollectionApiResponse } from '../response';
import type { RequestOptions } from '../response';
import type { BusinessOrder } from '@/types';

export class BusinessClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'business-orders') {}

  async getAll(options?: RequestOptions): CollectionResponse<BusinessOrder> {
    try {
      const [status, response] = await this.apiClient.getJson(this.baseEndpoint, options);
      if (status === StatusCodes.Http200 && isCollectionApiResponse<BusinessOrder>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async create(data: Omit<BusinessOrder, 'id'>): SingleEntityResponse<BusinessOrder> {
    try {
      const [status, response] = await this.apiClient.postJson(this.baseEndpoint, data);
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && isSingleEntityApiResponse<BusinessOrder>(response, ['id'])) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async update(id: number, data: Partial<Omit<BusinessOrder, 'id'>>): SingleEntityResponse<BusinessOrder> {
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/${id}`, data);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<BusinessOrder>(response, ['id'])) {
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

  async shopifyImport(): SingleEntityResponse<{ message: string }> {
    try {
      const [status, response] = await this.apiClient.postJson(`${this.baseEndpoint}/shopify-import`);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ message: string }>(response, ['message'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }
}
