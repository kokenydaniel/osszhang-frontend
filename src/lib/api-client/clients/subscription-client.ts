import type { ApiClient } from '../api-client';
import { StatusCodes, SingleEntityResponse, isSingleEntityApiResponse } from '../response';
import type { RawBillingSummary } from '@/types/billing';

export class SubscriptionClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'subscription') {}

  async getBilling(): SingleEntityResponse<RawBillingSummary> {
    try {
      const [status, response] = await this.apiClient.getJson(`${this.baseEndpoint}/billing`);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<RawBillingSummary>(response, ['effective_tier'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async checkout(priceId: string): SingleEntityResponse<{ url: string }> {
    try {
      const [status, response] = await this.apiClient.postJson(`${this.baseEndpoint}/checkout`, {
        price_id: priceId,
      });
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ url: string }>(response, ['url'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }

  async getPortal(): SingleEntityResponse<{ url: string }> {
    try {
      const [status, response] = await this.apiClient.getJson(`${this.baseEndpoint}/portal`);
      if (status === StatusCodes.Http200 && isSingleEntityApiResponse<{ url: string }>(response, ['url'])) {
        return this.apiClient.response(status, response);
      }
    } catch (err) {
      console.log('err', err);
    }
    return null;
  }
}
