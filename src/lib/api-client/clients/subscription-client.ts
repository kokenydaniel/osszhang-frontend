import type { ApiClient } from '../api-client';
import type { RawBillingSummary } from '@/types/billing';

export class SubscriptionClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'subscription') {}

  getBilling() {
    return this.apiClient.getJson<RawBillingSummary>(`${this.baseEndpoint}/billing`);
  }

  checkout(priceId: string) {
    return this.apiClient.postJson<{ url: string }>(`${this.baseEndpoint}/checkout`, {
      price_id: priceId,
    });
  }

  getPortal() {
    return this.apiClient.getJson<{ url: string }>(`${this.baseEndpoint}/portal`);
  }
}
