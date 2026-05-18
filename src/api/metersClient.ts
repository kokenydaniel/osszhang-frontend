import apiClient from './apiClient';
import { Meter, MeterReading } from '@/types';

export const metersClient = {
  getAll: () => apiClient.get<Meter[]>('/meters'),
  create: (data: Omit<Meter, 'id' | 'readings' | 'icon'> & Partial<Pick<Meter, 'icon'>>) => apiClient.post<Meter>('/meters', data),
  delete: (id: number) => apiClient.delete(`/meters/${id}`),
  addReading: (meterId: number, data: Omit<MeterReading, 'id' | 'consumption'>) => apiClient.post<MeterReading>(`/meters/${meterId}/readings`, data),
  updateReading: (meterId: number, readingId: number, data: Partial<Omit<MeterReading, 'id' | 'consumption'>>) => apiClient.put<MeterReading>(`/meters/${meterId}/readings/${readingId}`, data),
  deleteReading: (meterId: number, readingId: number) => apiClient.delete(`/meters/${meterId}/readings/${readingId}`),
};
