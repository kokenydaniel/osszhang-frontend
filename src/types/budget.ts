export interface LedgerEntry {
  id: number;
  date: string;
  amount: number;
  reason: string;
}

export interface CashTransaction {
  id: number;
  type: 'income' | 'expense';
  description: string;
  category: string;
  amount: number;
  encryptedPayload?: string;
  dueDate: string;
  paidDate: string | null;
  isBudget?: boolean;
  isReserve?: boolean;
  subItems?: LedgerEntry[];
}
