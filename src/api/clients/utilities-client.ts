import type { AxiosInstance } from 'axios';
import type { UtilitiesIndexResponse, UtilityBill, UtilitySettlement } from '@/types';

export class UtilitiesClient {
  constructor(protected http: AxiosInstance) {}

  getAll() {
    return this.http.get<UtilitiesIndexResponse>('/utilities');
  }

  create(data: Omit<UtilityBill, 'id'>) {
    return this.http.post<UtilityBill>('/utilities', data);
  }

  update(id: number, data: Partial<Omit<UtilityBill, 'id'>>) {
    return this.http.put<UtilityBill>(`/utilities/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`/utilities/${id}`);
  }

  cloneMonth(month: number, year: number) {
    return this.http.post<{ message: string } & UtilitiesIndexResponse>('/utilities/clone', { month, year });
  }

  settleMonth(month: number, year: number) {
    return this.http.post<{ message: string; settlement: UtilitySettlement } & UtilitiesIndexResponse>(
      '/utilities/settlement',
      { month, year },
    );
  }

  unsettleMonth(month: number, year: number) {
    return this.http.delete<{ message: string; manual_balance?: number } & UtilitiesIndexResponse>(
      '/utilities/settlement',
      { params: { month, year } },
    );
  }
}
