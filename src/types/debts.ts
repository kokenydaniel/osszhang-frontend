export interface Debt {
  id: number;
  name: string;
  targetAmount: number;
  paidAmount: number;
  annualInterestRate?: number | null;
  minimumPayment?: number | null;
  dueDay?: number | null;
  status: 'Még fizetendő' | 'Van még' | 'Maradt' | 'Lejárt';
}
