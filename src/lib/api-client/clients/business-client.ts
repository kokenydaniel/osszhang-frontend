import type { ApiClient } from '../api-client';
import type { BusinessOrder } from '@/types';

export class BusinessClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'business-orders') {}

  getAll() {
    return this.apiClient.getJson<BusinessOrder[]>(this.baseEndpoint);
  }

  create(data: Omit<BusinessOrder, 'id'>) {
    return this.apiClient.postJson<BusinessOrder>(this.baseEndpoint, data);
  }

  update(id: number, data: Partial<Omit<BusinessOrder, 'id'>>) {
    return this.apiClient.putJson<BusinessOrder>(`${this.baseEndpoint}/${id}`, data);
  }

  delete(id: number) {
    return this.apiClient.deleteJson(`${this.baseEndpoint}/${id}`);
  }

  shopifyImport() {
    return this.apiClient.postJson<{ message: string }>(`${this.baseEndpoint}/shopify-import`);
  }
}
