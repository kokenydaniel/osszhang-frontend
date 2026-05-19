import apiClient from './apiClient';
import { Investment } from '@/types';

export const investmentsClient = {
  getAll: () => apiClient.get<Investment[]>('/investments'),
  create: (data: Omit<Investment, 'id'>) => apiClient.post<Investment>('/investments', data),
  update: (id: number, data: Partial<Omit<Investment, 'id'>>) => apiClient.put<Investment>(`/investments/${id}`, data),
  delete: (id: number) => apiClient.delete(`/investments/${id}`),
};
