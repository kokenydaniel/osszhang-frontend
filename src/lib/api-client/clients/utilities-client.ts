import type { ApiClient } from '../api-client';
import type { RequestOptions } from '../response';
import type { UtilitiesIndexResponse, UtilityBill, UtilitySettlement } from '@/types';

export class UtilitiesClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'utilities') {}

  getAll(options?: RequestOptions) {
    return this.apiClient.getJson<UtilitiesIndexResponse>(this.baseEndpoint, options);
  }

  create(data: Omit<UtilityBill, 'id'>) {
    return this.apiClient.postJson<UtilityBill>(this.baseEndpoint, data);
  }

  update(id: number, data: Partial<Omit<UtilityBill, 'id'>>) {
    return this.apiClient.putJson<UtilityBill>(`${this.baseEndpoint}/${id}`, data);
  }

  delete(id: number) {
    return this.apiClient.deleteJson(`${this.baseEndpoint}/${id}`);
  }

  cloneMonth(month: number, year: number) {
    return this.apiClient.postJson<{ message: string } & UtilitiesIndexResponse>(`${this.baseEndpoint}/clone`, { month, year });
  }

  settleMonth(month: number, year: number) {
    return this.apiClient.postJson<{ message: string; settlement: UtilitySettlement } & UtilitiesIndexResponse>(
      `${this.baseEndpoint}/settlement`,
      { month, year },
    );
  }

  unsettleMonth(month: number, year: number) {
    return this.apiClient.deleteJson<{ message: string; manual_balance?: number } & UtilitiesIndexResponse>(
      `${this.baseEndpoint}/settlement`,
      undefined,
      { params: { month, year } },
    );
  }
}
