import apiClient from './apiClient';
import { SavingsAccount, LedgerEntry } from '@/types';

export const savingsClient = {
  getAll: () => apiClient.get<SavingsAccount[]>('/savings'),
  create: (data: Omit<SavingsAccount, 'id' | 'ledger'>) => apiClient.post<SavingsAccount>('/savings', data),
  update: (id: number, data: Partial<Omit<SavingsAccount, 'id' | 'ledger'>>) => apiClient.put<SavingsAccount>(`/savings/${id}`, data),
  delete: (id: number) => apiClient.delete(`/savings/${id}`),
  addEntry: (savingsId: number, data: Omit<LedgerEntry, 'id'>) => apiClient.post<SavingsAccount>(`/savings/${savingsId}/entries`, data),
  deleteEntry: (savingsId: number, entryId: number) => apiClient.delete<SavingsAccount>(`/savings/${savingsId}/entries/${entryId}`),
};
