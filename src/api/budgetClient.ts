import apiClient from './apiClient';
import { CashTransaction, LedgerEntry } from '@/types';

export const budgetClient = {
  getAll: () => apiClient.get<CashTransaction[]>('/transactions'),
  create: (data: Omit<CashTransaction, 'id'>) => apiClient.post<CashTransaction>('/transactions', data),
  cloneMonth: (month: number, year: number) =>
    apiClient.post<{ message: string }>('/transactions/clone', { month, year }),
  update: (id: number, data: Partial<Omit<CashTransaction, 'id' | 'subItems'>>) => apiClient.put<CashTransaction>(`/transactions/${id}`, data),
  delete: (id: number) => apiClient.delete(`/transactions/${id}`),
  addItem: (txId: number, data: Omit<LedgerEntry, 'id'>) => apiClient.post<CashTransaction>(`/transactions/${txId}/items`, data),
  deleteItem: (txId: number, itemId: number) => apiClient.delete<CashTransaction>(`/transactions/${txId}/items/${itemId}`),
};
