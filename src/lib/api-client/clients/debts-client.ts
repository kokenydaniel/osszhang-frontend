import type { ApiClient } from '../api-client';
import type { Debt } from '@/types';

export class DebtsClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'debts') {}

  getAll() {
    return this.apiClient.getJson<Debt[]>(this.baseEndpoint);
  }

  create(data: Omit<Debt, 'id'>) {
    return this.apiClient.postJson<Debt>(this.baseEndpoint, data);
  }

  update(id: number, data: Partial<Omit<Debt, 'id'>>) {
    return this.apiClient.putJson<Debt>(`${this.baseEndpoint}/${id}`, data);
  }

  delete(id: number) {
    return this.apiClient.deleteJson(`${this.baseEndpoint}/${id}`);
  }
}
