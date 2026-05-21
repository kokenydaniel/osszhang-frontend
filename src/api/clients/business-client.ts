import type { AxiosInstance } from 'axios';
import type { BusinessOrder } from '@/types';

export class BusinessClient {
  constructor(protected http: AxiosInstance) {}

  getAll() {
    return this.http.get<BusinessOrder[]>('/business-orders');
  }

  create(data: Omit<BusinessOrder, 'id'>) {
    return this.http.post<BusinessOrder>('/business-orders', data);
  }

  update(id: number, data: Partial<Omit<BusinessOrder, 'id'>>) {
    return this.http.put<BusinessOrder>(`/business-orders/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`/business-orders/${id}`);
  }

  shopifyImport() {
    return this.http.post<{ message: string }>('/business-orders/shopify-import');
  }
}
