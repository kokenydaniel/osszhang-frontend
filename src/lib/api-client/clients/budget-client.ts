import type { ApiClient } from '../api-client';
import type { RequestOptions } from '../response';
import type { BudgetListResponse, CashTransaction, LedgerEntry } from '@/types';

export class BudgetClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'transactions') {}

  getAll(walletId?: number | null, options?: RequestOptions) {
    return this.apiClient.getJson<BudgetListResponse>(this.baseEndpoint, {
      ...options,
      params: {
        ...options?.params,
        ...(walletId ? { walletId } : {}),
      },
    });
  }

  getGoalRows(walletId: number | null | undefined, month: number, year: number, options?: RequestOptions) {
    return this.apiClient.getJson<CashTransaction[]>(`${this.baseEndpoint}/goal-rows`, {
      ...options,
      params: {
        ...options?.params,
        month,
        year,
        ...(walletId ? { walletId } : {}),
      },
    });
  }

  create(data: Omit<CashTransaction, 'id'>) {
    return this.apiClient.postJson<CashTransaction>(this.baseEndpoint, data);
  }

  cloneMonth(month: number, year: number, walletId?: number | null) {
    return this.apiClient.postJson<{ message: string }>(`${this.baseEndpoint}/clone`, {
      month,
      year,
      ...(walletId ? { walletId } : {}),
    });
  }

  update(id: number, data: Partial<Omit<CashTransaction, 'id' | 'subItems'>>) {
    return this.apiClient.putJson<CashTransaction>(`${this.baseEndpoint}/${id}`, data);
  }

  delete(id: number) {
    return this.apiClient.deleteJson(`${this.baseEndpoint}/${id}`);
  }

  addItem(txId: number | string, data: Omit<LedgerEntry, 'id'>) {
    return this.apiClient.postJson<CashTransaction>(`${this.baseEndpoint}/${txId}/items`, data);
  }

  deleteItem(txId: number | string, itemId: number) {
    return this.apiClient.deleteJson<CashTransaction>(`${this.baseEndpoint}/${txId}/items/${itemId}`);
  }
}
