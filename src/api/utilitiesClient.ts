import apiClient from './apiClient';
import { UtilitiesIndexResponse, UtilityBill } from '@/types';

export const utilitiesClient = {
  getAll: () => apiClient.get<UtilitiesIndexResponse>('/utilities'),
  create: (data: Omit<UtilityBill, 'id'>) => apiClient.post<UtilityBill>('/utilities', data),
  update: (id: number, data: Partial<Omit<UtilityBill, 'id'>>) => apiClient.put<UtilityBill>(`/utilities/${id}`, data),
  delete: (id: number) => apiClient.delete(`/utilities/${id}`),
  cloneMonth: (month: number, year: number) =>
    apiClient.post<{ message: string } & UtilitiesIndexResponse>('/utilities/clone', { month, year }),
  settleMonth: (month: number, year: number) =>
    apiClient.post<{ message: string; settlement: import('@/types').UtilitySettlement } & UtilitiesIndexResponse>(
      '/utilities/settlement',
      { month, year },
    ),
  unsettleMonth: (month: number, year: number) =>
    apiClient.delete<{ message: string; manual_balance?: number } & UtilitiesIndexResponse>(
      '/utilities/settlement',
      { params: { month, year } },
    ),
};
