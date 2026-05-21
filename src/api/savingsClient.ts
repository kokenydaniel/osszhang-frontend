import apiClient from './apiClient';
import { SavingsAccount, LedgerEntry } from '@/types';

type RequestConfig = { silent?: boolean };

export const savingsClient = {
  getAll: (config?: RequestConfig) => apiClient.get<SavingsAccount[]>('/savings', config),
  create: (data: Omit<SavingsAccount, 'id' | 'ledger'>) => apiClient.post<SavingsAccount>('/savings', data),
  update: (id: number, data: Partial<Omit<SavingsAccount, 'id' | 'ledger'>>) =>
    apiClient.put<SavingsAccount>(`/savings/${id}`, data),
  delete: (id: number) => apiClient.delete(`/savings/${id}`),
  addEntry: (savingsId: number, entry: Omit<LedgerEntry, 'id'>) =>
    apiClient.post<SavingsAccount>(`/savings/${savingsId}/entries`, entry),
  updateEntry: (savingsId: number, entryId: number, entry: Partial<Omit<LedgerEntry, 'id'>>) =>
    apiClient.put<SavingsAccount>(`/savings/${savingsId}/entries/${entryId}`, entry),
  deleteEntry: (savingsId: number, entryId: number) =>
    apiClient.delete<SavingsAccount>(`/savings/${savingsId}/entries/${entryId}`),
};
