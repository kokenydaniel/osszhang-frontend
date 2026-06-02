import type { ApiClient } from '../api-client';
import { StatusCodes, SingleEntityResponse, CollectionResponse, EmptyResponse, isSingleEntityApiResponse, isCollectionApiResponse } from '../response';
import type { Meter } from '@/types';
import type { CreateMeterPayload, CreateReadingPayload, UpdateReadingPayload } from '@/types/meters';
import type { RequestOptions } from '../response';

export class MetersClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'meters') {}

  async getAll(options?: RequestOptions): CollectionResponse<Meter> {
    try {
      const [status, response] = await this.apiClient.getJson(this.baseEndpoint, options);
      if (status === StatusCodes.Http200 && isCollectionApiResponse<Meter>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async create(data: CreateMeterPayload & { household_id: number }): SingleEntityResponse<Meter> {
    try {
      const [status, response] = await this.apiClient.postJson(this.baseEndpoint, data);
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && isSingleEntityApiResponse<Meter>(response, ['id'])) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, response);
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

  async addReading(meterId: number, data: CreateReadingPayload): SingleEntityResponse<Meter> {
    try {
      const [status, response] = await this.apiClient.postJson(`${this.baseEndpoint}/${meterId}/readings`, data);
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && isSingleEntityApiResponse<Meter>(response, ['id'])) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async updateReading(meterId: number, readingId: number, data: UpdateReadingPayload): SingleEntityResponse<Meter> {
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/${meterId}/readings/${readingId}`, data);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<Meter>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async deleteReading(meterId: number, readingId: number): SingleEntityResponse<Meter> {
    try {
      const [status, response] = await this.apiClient.deleteJson(`${this.baseEndpoint}/${meterId}/readings/${readingId}`);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<Meter>(response, ['id'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }
}
