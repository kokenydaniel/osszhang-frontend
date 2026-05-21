import type { ApiClient } from '../api-client';
import type { Investment } from '@/types';
import type { RequestOptions } from '../response';

export class InvestmentsClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'investments') {}

  getAll(options?: RequestOptions) {
    return this.apiClient.getJson<Investment[]>(this.baseEndpoint, options);
  }

  create(data: Omit<Investment, 'id'>) {
    return this.apiClient.postJson<Investment>(this.baseEndpoint, data);
  }

  update(id: number, data: Partial<Omit<Investment, 'id'>>) {
    return this.apiClient.putJson<Investment>(`${this.baseEndpoint}/${id}`, data);
  }

  delete(id: number) {
    return this.apiClient.deleteJson(`${this.baseEndpoint}/${id}`);
  }
}
