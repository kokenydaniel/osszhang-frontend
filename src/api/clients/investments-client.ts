import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { Investment } from '@/types';

type RequestConfig = AxiosRequestConfig & { silent?: boolean };

export class InvestmentsClient {
  constructor(protected http: AxiosInstance) {}

  getAll(config?: RequestConfig) {
    return this.http.get<Investment[]>('/investments', config);
  }

  create(data: Omit<Investment, 'id'>) {
    return this.http.post<Investment>('/investments', data);
  }

  update(id: number, data: Partial<Omit<Investment, 'id'>>) {
    return this.http.put<Investment>(`/investments/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`/investments/${id}`);
  }
}
