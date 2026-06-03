import type { ApiClient } from '../api-client';
import { StatusCodes, SingleEntityResponse, CollectionResponse, EmptyResponse, isCollectionApiResponse, isSingleEntityApiResponse } from '../response';
import type { RequestOptions } from '../response';
import { unwrapApiEntity, unwrapApiCollection } from '../type-guards';
import type { BusinessOrder } from '@/types';
import type { BusinessDocument, BusinessDocumentType } from '@/types/attachments';

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
      const entity = unwrapApiEntity<BusinessOrder>(response, ['id']);
      if ((status === StatusCodes.Http200 || status === StatusCodes.Http201) && entity) {
        return this.apiClient.response(status as StatusCodes.Http200 | StatusCodes.Http201, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async update(id: number, data: Partial<Omit<BusinessOrder, 'id'>>): SingleEntityResponse<BusinessOrder> {
    try {
      const [status, response] = await this.apiClient.putJson(`${this.baseEndpoint}/${id}`, data);
      const entity = unwrapApiEntity<BusinessOrder>(response, ['id']);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
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

  async listDocuments(year: number, month: number): CollectionResponse<BusinessDocument> {
    try {
      const [status, response] = await this.apiClient.getJson('business-documents', {
        params: { year, month },
      });
      const items = unwrapApiCollection<BusinessDocument>(response, ['id']);
      if (status === StatusCodes.Http200 && items) {
        return this.apiClient.response(status, items);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async uploadDocument(params: {
    year: number;
    month: number;
    documentType: BusinessDocumentType;
    file: File;
    businessOrderId?: number | null;
    label?: string | null;
  }): SingleEntityResponse<BusinessDocument> {
    try {
      const form = new FormData();
      form.append('year', String(params.year));
      form.append('month', String(params.month));
      form.append('document_type', params.documentType);
      form.append('file', params.file);
      if (params.businessOrderId) {
        form.append('business_order_id', String(params.businessOrderId));
      }
      if (params.label?.trim()) {
        form.append('label', params.label.trim());
      }
      const [status, response] = await this.apiClient.postFormData('business-documents', form);
      const entity = unwrapApiEntity<BusinessDocument>(response, ['id']);
      if (status === StatusCodes.Http201 && entity) {
        return this.apiClient.response(StatusCodes.Http201, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async sumupImport(year: number, month: number): SingleEntityResponse<{ message: string; imported?: number }> {
    try {
      const [status, response] = await this.apiClient.postJson('business-documents/sumup-import', {
        year,
        month,
      });
      const entity = unwrapApiEntity<{ message: string; imported?: number }>(response, ['message']);
      if (status === StatusCodes.Http200 && entity) {
        return this.apiClient.response(status, entity);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async deleteDocument(id: number): EmptyResponse {
    try {
      const [status] = await this.apiClient.deleteJson(`business-documents/${id}`);
      if (status === StatusCodes.Http200) {
        return this.apiClient.response(status as StatusCodes.Http200, null);
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
