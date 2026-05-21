import type { ApiClient } from '../api-client';
import type { LedgerEntry, SavingsAccount } from '@/types';
import type { RequestOptions } from '../response';

export class SavingsClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'savings') {}

  getAll(options?: RequestOptions) {
    return this.apiClient.getJson<SavingsAccount[]>(this.baseEndpoint, options);
  }

  create(data: Omit<SavingsAccount, 'id' | 'ledger'>) {
    return this.apiClient.postJson<SavingsAccount>(this.baseEndpoint, data);
  }

  update(id: number, data: Partial<Omit<SavingsAccount, 'id' | 'ledger'>>) {
    return this.apiClient.putJson<SavingsAccount>(`${this.baseEndpoint}/${id}`, data);
  }

  delete(id: number) {
    return this.apiClient.deleteJson(`${this.baseEndpoint}/${id}`);
  }

  addEntry(savingsId: number, entry: Omit<LedgerEntry, 'id'>) {
    return this.apiClient.postJson<SavingsAccount>(`${this.baseEndpoint}/${savingsId}/entries`, entry);
  }

  updateEntry(savingsId: number, entryId: number, entry: Partial<Omit<LedgerEntry, 'id'>>) {
    return this.apiClient.putJson<SavingsAccount>(`${this.baseEndpoint}/${savingsId}/entries/${entryId}`, entry);
  }

  deleteEntry(savingsId: number, entryId: number) {
    return this.apiClient.deleteJson<SavingsAccount>(`${this.baseEndpoint}/${savingsId}/entries/${entryId}`);
  }
}
