import type { ApiClient } from '../api-client';
import type { Meter, MeterReading } from '@/types';

export class MetersClient {
  constructor(protected apiClient: ApiClient, protected baseEndpoint = 'meters') {}

  getAll() {
    return this.apiClient.getJson<Meter[]>(this.baseEndpoint);
  }

  create(data: Omit<Meter, 'id' | 'readings' | 'icon'> & Partial<Pick<Meter, 'icon'>>) {
    return this.apiClient.postJson<Meter>(this.baseEndpoint, data);
  }

  delete(id: number) {
    return this.apiClient.deleteJson(`${this.baseEndpoint}/${id}`);
  }

  addReading(meterId: number, data: Omit<MeterReading, 'id' | 'consumption'>) {
    return this.apiClient.postJson<Meter>(`${this.baseEndpoint}/${meterId}/readings`, data);
  }

  updateReading(meterId: number, readingId: number, data: Partial<Omit<MeterReading, 'id' | 'consumption'>>) {
    return this.apiClient.putJson<Meter>(`${this.baseEndpoint}/${meterId}/readings/${readingId}`, data);
  }

  deleteReading(meterId: number, readingId: number) {
    return this.apiClient.deleteJson<Meter>(`${this.baseEndpoint}/${meterId}/readings/${readingId}`);
  }
}
