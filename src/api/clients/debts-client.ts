import type { AxiosInstance } from 'axios';
import type { Debt } from '@/types';

export class DebtsClient {
  constructor(protected http: AxiosInstance) {}

  getAll() {
    return this.http.get<Debt[]>('/debts');
  }

  create(data: Omit<Debt, 'id'>) {
    return this.http.post<Debt>('/debts', data);
  }

  update(id: number, data: Partial<Omit<Debt, 'id'>>) {
    return this.http.put<Debt>(`/debts/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`/debts/${id}`);
  }
}
