import type { ApiClient } from '../api-client';
import type { Debt } from '@/types';
import type { RequestOptions } from '../response';

export class DebtsClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'debts') {}

  getAll(walletId?: number | null, options?: RequestOptions) {
    return this.apiClient.getJson<Debt[]>(this.baseEndpoint, {
      ...options,
      params: {
        ...options?.params,
        ...(walletId ? { walletId } : {}),
      },
    });
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
