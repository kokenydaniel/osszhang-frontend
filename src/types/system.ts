export type PaymentStatus = 'Várható' | 'Teljesítve' | 'Késik';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type Currency = 'HUF' | 'EUR' | 'USD' | 'BTC' | 'ETH' | 'HRK';
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const MONTH_NAMES: Record<number, string> = {
  1: 'Január', 2: 'Február', 3: 'Március', 4: 'Április',
  5: 'Május', 6: 'Június', 7: 'Július', 8: 'Augusztus',
  9: 'Szeptember', 10: 'Október', 11: 'November', 12: 'December',
};
