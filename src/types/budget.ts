export interface LedgerEntry {
  id: number;
  date: string;
  amount: number;
  reason: string;
}

export interface CashTransaction {
  id: number | string;
  walletId?: number | null;
  type: 'income' | 'expense';
  description: string;
  category: string;
  amount: number;
  encryptedPayload?: string;
  dueDate: string;
  paidDate: string | null;
  currency?: string;
  isBudget?: boolean;
  isReserve?: boolean;
  isSavingsGoal?: boolean;
  savingGoalId?: number;
  subItems?: LedgerEntry[];
}

export interface BudgetListResponse {
  transactions: CashTransaction[];
  goalRows: CashTransaction[];
}

export function isSavingsGoalTransaction(tx: Pick<CashTransaction, 'id' | 'isSavingsGoal'>): boolean {
  return tx.isSavingsGoal === true || (typeof tx.id === 'string' && tx.id.startsWith('goal-'));
}
