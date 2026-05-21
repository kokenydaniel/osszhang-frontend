import type { AxiosInstance } from 'axios';
import type { Meter, MeterReading } from '@/types';

export class MetersClient {
  constructor(protected http: AxiosInstance) {}

  getAll() {
    return this.http.get<Meter[]>('/meters');
  }

  create(data: Omit<Meter, 'id' | 'readings' | 'icon'> & Partial<Pick<Meter, 'icon'>>) {
    return this.http.post<Meter>('/meters', data);
  }

  delete(id: number) {
    return this.http.delete(`/meters/${id}`);
  }

  addReading(meterId: number, data: Omit<MeterReading, 'id' | 'consumption'>) {
    return this.http.post<Meter>(`/meters/${meterId}/readings`, data);
  }

  updateReading(meterId: number, readingId: number, data: Partial<Omit<MeterReading, 'id' | 'consumption'>>) {
    return this.http.put<Meter>(`/meters/${meterId}/readings/${readingId}`, data);
  }

  deleteReading(meterId: number, readingId: number) {
    return this.http.delete<Meter>(`/meters/${meterId}/readings/${readingId}`);
  }
}
