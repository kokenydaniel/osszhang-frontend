import apiClient from './apiClient';
import { Debt } from '@/types';

export const debtsClient = {
  getAll: () => apiClient.get<Debt[]>('/debts'),
  create: (data: Omit<Debt, 'id'>) => apiClient.post<Debt>('/debts', data),
  update: (id: number, data: Partial<Omit<Debt, 'id'>>) => apiClient.put<Debt>(`/debts/${id}`, data),
  delete: (id: number) => apiClient.delete(`/debts/${id}`),
};
