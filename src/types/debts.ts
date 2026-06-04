export type DebtInstallmentPaymentSource = 'budget' | 'debt_pay';

export interface DebtInstallmentPayment {
  period: string;
  paidAt: string | null;
  amount: number;
  source: DebtInstallmentPaymentSource;
}

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
  installmentPayments?: DebtInstallmentPayment[];
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
  installmentPayments?: DebtInstallmentPayment[];
}

export type UpdateDebtPayload = Partial<CreateDebtPayload>;
