import apiClient from './apiClient';
import { Meter, MeterReading } from '@/types';

export const metersClient = {
  getAll: () => apiClient.get<Meter[]>('/meters'),
  create: (data: Omit<Meter, 'id' | 'readings' | 'icon'> & Partial<Pick<Meter, 'icon'>>) => apiClient.post<Meter>('/meters', data),
  delete: (id: number) => apiClient.delete(`/meters/${id}`),
  addReading: (meterId: number, data: Omit<MeterReading, 'id' | 'consumption'>) => apiClient.post<Meter>(`/meters/${meterId}/readings`, data),
  updateReading: (meterId: number, readingId: number, data: Partial<Omit<MeterReading, 'id' | 'consumption'>>) => apiClient.put<Meter>(`/meters/${meterId}/readings/${readingId}`, data),
  deleteReading: (meterId: number, readingId: number) => apiClient.delete<Meter>(`/meters/${meterId}/readings/${readingId}`),
};
