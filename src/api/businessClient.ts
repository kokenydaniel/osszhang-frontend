import apiClient from './apiClient';
import { BusinessOrder } from '@/types';

export const businessClient = {
  getAll: () => apiClient.get<BusinessOrder[]>('/business-orders'),
  create: (data: Omit<BusinessOrder, 'id'>) => apiClient.post<BusinessOrder>('/business-orders', data),
  update: (id: number, data: Partial<Omit<BusinessOrder, 'id'>>) => apiClient.put<BusinessOrder>(`/business-orders/${id}`, data),
  delete: (id: number) => apiClient.delete(`/business-orders/${id}`),
  shopifyImport: () => apiClient.post<{ message: string }>('/business-orders/shopify-import'),
};
