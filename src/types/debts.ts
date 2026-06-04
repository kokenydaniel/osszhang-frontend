export interface Debt {
  id: number;
  walletId?: number | null;
  name: string;
  targetAmount: number;
  paidAmount: number;
  annualInterestRate?: number | null;
  minimumPayment?: number | null;
  dueDay?: number | null;
  status: 'Még fizetendő' | 'Van még' | 'Maradt' | 'Lejárt';
  budgetSyncEnabled?: boolean;
  budgetStartYear?: number | null;
  budgetStartMonth?: number | null;
  paidInstallmentMonths?: string[];
  attachmentCount?: number;
}

export interface CreateDebtPayload {
  name: string;
  targetAmount: number;
  paidAmount: number;
  annualInterestRate?: number | null;
  minimumPayment?: number | null;
  dueDay?: number | null;
  status: 'Még fizetendő' | 'Van még' | 'Maradt' | 'Lejárt';
  walletId?: number | null;
  budgetSyncEnabled?: boolean;
  budgetStartYear?: number | null;
  budgetStartMonth?: number | null;
  paidInstallmentMonths?: string[];
}

export type UpdateDebtPayload = Partial<CreateDebtPayload>;
