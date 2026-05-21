import type { ApiClient } from '../api-client';
import type { CashTransaction, LedgerEntry } from '@/types';

export class BudgetClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'transactions') {}

  getAll() {
    return this.apiClient.getJson<CashTransaction[]>(this.baseEndpoint);
  }

  create(data: Omit<CashTransaction, 'id'>) {
    return this.apiClient.postJson<CashTransaction>(this.baseEndpoint, data);
  }

  cloneMonth(month: number, year: number) {
    return this.apiClient.postJson<{ message: string }>(`${this.baseEndpoint}/clone`, { month, year });
  }

  update(id: number, data: Partial<Omit<CashTransaction, 'id' | 'subItems'>>) {
    return this.apiClient.putJson<CashTransaction>(`${this.baseEndpoint}/${id}`, data);
  }

  delete(id: number) {
    return this.apiClient.deleteJson(`${this.baseEndpoint}/${id}`);
  }

  addItem(txId: number, data: Omit<LedgerEntry, 'id'>) {
    return this.apiClient.postJson<CashTransaction>(`${this.baseEndpoint}/${txId}/items`, data);
  }

  deleteItem(txId: number, itemId: number) {
    return this.apiClient.deleteJson<CashTransaction>(`${this.baseEndpoint}/${txId}/items/${itemId}`);
  }
}
