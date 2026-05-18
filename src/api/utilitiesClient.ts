import apiClient from './apiClient';
import { UtilityBill } from '@/types';

export const utilitiesClient = {
  getAll: () => apiClient.get<UtilityBill[]>('/utilities'),
  create: (data: Omit<UtilityBill, 'id'>) => apiClient.post<UtilityBill>('/utilities', data),
  update: (id: number, data: Partial<Omit<UtilityBill, 'id'>>) => apiClient.put<UtilityBill>(`/utilities/${id}`, data),
  delete: (id: number) => apiClient.delete(`/utilities/${id}`),
};
