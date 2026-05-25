import type { ApiClient } from '../api-client';
import type { RawApiWallet, WalletProfile } from '@/types';

export class WalletClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'wallets') {}

  getAll() {
    return this.apiClient.getJson<RawApiWallet[]>(this.baseEndpoint);
  }

  create(data: { name: string; isShared?: boolean; ownerId?: number }, options?: import('../response').RequestOptions) {
    return this.apiClient.postJson<RawApiWallet>(this.baseEndpoint, data, options);
  }

  update(id: number, data: { name: string }) {
    return this.apiClient.putJson<RawApiWallet>(`${this.baseEndpoint}/${id}`, data);
  }

  updateManualBalance(id: number, manualBalance: number) {
    return this.apiClient.putJson<RawApiWallet>(`${this.baseEndpoint}/${id}/manual-balance`, {
      manual_balance: manualBalance,
    });
  }

  delete(id: number) {
    return this.apiClient.deleteJson(`${this.baseEndpoint}/${id}`);
  }
}

export type { WalletProfile };
