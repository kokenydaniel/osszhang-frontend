import type { AxiosInstance } from 'axios';
import type { CashTransaction, LedgerEntry } from '@/types';

export class BudgetClient {
  constructor(protected http: AxiosInstance) {}

  getAll() {
    return this.http.get<CashTransaction[]>('/transactions');
  }

  create(data: Omit<CashTransaction, 'id'>) {
    return this.http.post<CashTransaction>('/transactions', data);
  }

  cloneMonth(month: number, year: number) {
    return this.http.post<{ message: string }>('/transactions/clone', { month, year });
  }

  update(id: number, data: Partial<Omit<CashTransaction, 'id' | 'subItems'>>) {
    return this.http.put<CashTransaction>(`/transactions/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`/transactions/${id}`);
  }

  addItem(txId: number, data: Omit<LedgerEntry, 'id'>) {
    return this.http.post<CashTransaction>(`/transactions/${txId}/items`, data);
  }

  deleteItem(txId: number, itemId: number) {
    return this.http.delete<CashTransaction>(`/transactions/${txId}/items/${itemId}`);
  }
}
