import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { LedgerEntry, SavingsAccount } from '@/types';

type RequestConfig = AxiosRequestConfig & { silent?: boolean };

export class SavingsClient {
  constructor(protected http: AxiosInstance) {}

  getAll(config?: RequestConfig) {
    return this.http.get<SavingsAccount[]>('/savings', config);
  }

  create(data: Omit<SavingsAccount, 'id' | 'ledger'>) {
    return this.http.post<SavingsAccount>('/savings', data);
  }

  update(id: number, data: Partial<Omit<SavingsAccount, 'id' | 'ledger'>>) {
    return this.http.put<SavingsAccount>(`/savings/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`/savings/${id}`);
  }

  addEntry(savingsId: number, entry: Omit<LedgerEntry, 'id'>) {
    return this.http.post<SavingsAccount>(`/savings/${savingsId}/entries`, entry);
  }

  updateEntry(savingsId: number, entryId: number, entry: Partial<Omit<LedgerEntry, 'id'>>) {
    return this.http.put<SavingsAccount>(`/savings/${savingsId}/entries/${entryId}`, entry);
  }

  deleteEntry(savingsId: number, entryId: number) {
    return this.http.delete<SavingsAccount>(`/savings/${savingsId}/entries/${entryId}`);
  }
}
